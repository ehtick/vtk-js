import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkDeviceOrientationToCamera from '@kitware/vtk.js/Interaction/Misc/DeviceOrientationToCamera';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const interactor = fullScreenRenderer.getInteractor();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

let cameraListenerId = -1;

let nbTextureLoaded = 0;
const texture = vtkTexture.newInstance();
const texturePathList = [
  `${__BASE_PATH__}/data/skybox/mountains/right.jpg`,
  `${__BASE_PATH__}/data/skybox/mountains/left.jpg`,
  `${__BASE_PATH__}/data/skybox/mountains/top.jpg`,
  `${__BASE_PATH__}/data/skybox/mountains/bottom.jpg`,
  `${__BASE_PATH__}/data/skybox/mountains/front.jpg`,
  `${__BASE_PATH__}/data/skybox/mountains/back.jpg`,
];

const cube = vtkCubeSource.newInstance();
cube.setGenerate3DTextureCoordinates(true);

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(cube.getOutputPort());

const actor = vtkActor.newInstance();
actor.getProperty().setDiffuse(0.0);
actor.getProperty().setAmbient(1.0);
actor.setMapper(mapper);
actor.addTexture(texture);

function render() {
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

function dataReady() {
  const bounds = renderer.computeVisiblePropBounds();
  const scale = 500;
  cube.setBounds(
    bounds[0] * scale,
    bounds[1] * scale,
    bounds[2] * scale,
    bounds[3] * scale,
    bounds[4] * scale,
    bounds[5] * scale
  );
  renderer.addActor(actor);

  renderer.getActiveCamera().setPhysicalViewUp(0, -1, 0);
  renderer.getActiveCamera().setPhysicalViewNorth(0, 0, 1);
  renderer.getActiveCamera().setFocalPoint(0, 0, 1);
  renderer.getActiveCamera().setPosition(0, 0, -50);
  renderer.getActiveCamera().setViewAngle(80);
  renderer.resetCameraClippingRange();
  render();
}

function loadTexture(url, index) {
  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  reader.setUrl(url, { loadData: true }).then(() => {
    const dataset = reader.getOutputData();
    const scalarName = dataset.getPointData().getArrayByIndex(0).getName();
    dataset.getPointData().setActiveScalars(scalarName);
    texture.setInputData(dataset, index);
    nbTextureLoaded += 1;
    if (nbTextureLoaded === texturePathList.length) {
      dataReady();
    }
  });
}

/* eslint-disable no-alert */

function validateMotionDetectionAgain() {
  if (!vtkDeviceOrientationToCamera.isDeviceOrientationSupported()) {
    vtkDeviceOrientationToCamera.removeCameraToSynchronize(cameraListenerId);
    vtkDeviceOrientationToCamera.removeWindowListeners();
    alert('No motion have been detected. Freeing the camera.');
  }
}

// Trigger the loading of the texture in parallel
texturePathList.forEach(loadTexture);

// If device support motion bind it to the camera
if (vtkDeviceOrientationToCamera.isDeviceOrientationSupported()) {
  vtkDeviceOrientationToCamera.addWindowListeners();
  cameraListenerId = vtkDeviceOrientationToCamera.addCameraToSynchronize(
    interactor,
    renderer.getActiveCamera(),
    renderer.resetCameraClippingRange
  );
} else {
  alert(
    'Your device does not support motion detection so regular interaction will be available'
  );
}

/* eslint-enable no-alert */

setTimeout(validateMotionDetectionAgain, 100);
