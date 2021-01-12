// BabylonJS Dependencies
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

import { TreeNode } from "@ts/file-resolver";
import { useCallback } from "react";
import * as GUI from "babylonjs-gui";

interface Props {
  treeNode: TreeNode;
}

function makeLabel(boxMesh: BABYLON.Mesh, labelText: string, scene: BABYLON.Scene): void {
  const labelPlane = BABYLON.MeshBuilder.CreatePlane(
    `${boxMesh.name}-label-plane`,
    { width: 1 },
    scene
  );

  labelPlane.parent = boxMesh;

  // ExtendSize is the distance from the center of the bounding box to an edge
  // Put the label just in front of the edge
  const halfBoxSide = boxMesh.getBoundingInfo().boundingBox.extendSize.x;
  labelPlane.position.z = (halfBoxSide + 0.1) * -1;

  const labelTexture = GUI.AdvancedDynamicTexture.CreateForMesh(labelPlane);
  const labelTextBlock = new GUI.TextBlock(undefined, labelText);
  labelTextBlock.fontSize = 100;
  labelTexture.addControl(labelTextBlock);
}

export function buildTree(
  rootNode: TreeNode,
  scene: BABYLON.Scene,
  nodePosition: BABYLON.Vector3
): BABYLON.Mesh {
  const verticalDisplacement = 1;
  const horizontalDisplacement = 1;
  const parentNode = BABYLON.MeshBuilder.CreateBox(
    `${rootNode.filePath}-node`,
    { size: 0.5 },
    scene
  );
  parentNode.position = nodePosition;

  makeLabel(parentNode, rootNode.filePath, scene);

  const [evenChildren, oddChildOpt] = (() => {
    if (rootNode.children.length % 2 === 1) {
      return [rootNode.children.slice(1), rootNode.children[0]] as const;
    } else {
      return [rootNode.children, undefined] as const;
    }
  })();

  const positionsAndNodes = evenChildren.map((treeNode, index) => {
    const isOdd = index % 2 === 1;
    const baseMultiplier = Math.floor(index / 2) + horizontalDisplacement;
    const xPos = isOdd ? baseMultiplier * -1 : baseMultiplier;

    return [
      new BABYLON.Vector3(xPos, verticalDisplacement, 0),
      treeNode,
    ] as const;
  });

  const oddChildPosition = new BABYLON.Vector3(0, verticalDisplacement, 0);
  const oddChildLines = oddChildOpt ? [BABYLON.Vector3.Zero(), oddChildPosition] : [];

  const lines = positionsAndNodes.map(([position, _]) => {
    return [nodePosition, position];
  });

  const combinedLines = [ ...lines, ...[oddChildLines] ];
  if (combinedLines.length > 0) {
    const lineSystem = BABYLON.MeshBuilder.CreateLineSystem(
      `${rootNode.filePath}-branches`,
      {
        lines: [...lines, ...[oddChildLines]],
      },
      scene
    );
    lineSystem.parent = parentNode;
  }


  positionsAndNodes.forEach(([position, node]) => {
    const childNode = buildTree(node, scene, position)
    childNode.parent = parentNode;
  });

  if (oddChildOpt) {
    const childNode = buildTree(oddChildOpt, scene, oddChildPosition);
    childNode.parent = parentNode
  }

  return parentNode;
}

async function createScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement, tree: TreeNode): Promise<BABYLON.Scene> {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.FreeCamera(
    "camera1",
    new BABYLON.Vector3(0, 5, -10),
    scene
  );

  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);

  const xr = await scene.createDefaultXRExperienceAsync({
    uiOptions: {
      sessionMode: "immersive-ar",
    },
    optionalFeatures: true,
  });

  const featuresManager = xr.baseExperience.featuresManager;
  const anchorSystem = featuresManager.enableFeature(
    BABYLON.WebXRAnchorSystem,
    "latest"
  ) as BABYLON.WebXRAnchorSystem;
  const hitTest = featuresManager.enableFeature(
    BABYLON.WebXRHitTest,
    "latest"
  ) as BABYLON.WebXRHitTest;

  const rootNode = buildTree(tree, scene, BABYLON.Vector3.Zero());

  hitTest.onHitTestResultObservable.add((results) => {
    if (results.length > 0) {
      const firstHit = results[0];
      anchorSystem.addAnchorPointUsingHitTestResultAsync(firstHit);
    }
  });

  anchorSystem.onAnchorAddedObservable.add((anchorEvent) => {
    hitTest.onHitTestResultObservable.clear();
    anchorEvent.attachedNode = rootNode;
  });

  return scene;
}

async function renderNode(treeNode: TreeNode, canvas: HTMLCanvasElement): Promise<void> {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = await createScene(engine, canvas, treeNode);

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
}

export const TreeNodeRenderer: React.FC<Props> = ({ treeNode }) => {
  const onCanvasMount = useCallback((canvasElement: HTMLCanvasElement) => {
    renderNode(treeNode, canvasElement).catch(console.error)
  }, [treeNode]);

  return (
    <canvas style={{ width: 100, height: 100 }} touch-action="none" ref={ onCanvasMount }></canvas>
  );
};
