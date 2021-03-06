import {
  cameraControls,
  cameraMove,
  drawing,
  mouse,
  mouseButton,
  mouseDown,
  painting,
  picking,
  setCameraMove,
  setMouseButton,
  setMouseDown,
  setPainting,
  setDrawing,
  setPicking,
  setShift,
  shift,
} from './input'
import {
  aCanvas,
  bCanvas,
  camera,
  colorPicker,
  gCanvas,
  hCanvas,
  height,
  hotbar,
  hotbarCanvas,
  hotbarColors,
  hsl,
  layer,
  layer2,
  layerCTXs,
  lCanvas,
  mouseTexture,
  rCanvas,
  renderer,
  rgb,
  saveIcon,
  sCanvas,
  scene,
  setAlpha,
  setHeight,
  setHotbar,
  setMouseTexture,
  setTexture,
  setWidth,
  showCanvas,
  showZoom,
  textureCTX,
  textureImage,
  updateColor,
  updateTextureHighlight,
  width,
  zoom,
  zoomPos,
} from './render'
import { download, raycaster, rgb2hex, wrap } from './util'

import saveNormal from '../res/save.png'
import saveSelected from '../res/save_selected.png'
import upURL from '../res/up_arrow.png'
import upSelectedURL from '../res/up_arrow_selected.png'
import downURL from '../res/down_arrow.png'
import downSelectedURL from '../res/down_arrow_selected.png'
import { clamp } from 'three/src/math/MathUtils'
import { Intersection } from 'three'

export const keys: { [key: string]: boolean } = {}
export const codes: { [code: string]: boolean } = {}

const prevDraw = { x: -1, y: -1 }

document.addEventListener('mousemove', onMouseMove)
function onMouseMove(event: MouseEvent) {
  mouse.x = (event.clientX / width) * 2 - 1
  mouse.y = -(event.clientY / height) * 2 + 1

  if (mouseDown && (mouseButton === 0 || mouseButton === 1 || mouseButton === 2)) {
    switch (picking) {
      case 'h':
        onPickN(onPickH, clamp(event.clientX - colorPicker.clientLeft, 0, 256), 360)
        break
      case 's':
        onPickN(onPickS, clamp(event.clientX - colorPicker.clientLeft, 0, 256), 100)
        break
      case 'l':
        onPickN(onPickL, clamp(event.clientX - colorPicker.clientLeft, 0, 256), 100)
        break
      case 'r':
        onPickN(onPickR, clamp(event.clientX - colorPicker.clientLeft, 0, 256), 255)
        break
      case 'g':
        onPickN(onPickG, clamp(event.clientX - colorPicker.clientLeft, 0, 256), 255)
        break
      case 'b':
        onPickN(onPickB, clamp(event.clientX - colorPicker.clientLeft, 0, 256), 255)
        break
      case 'a':
        onPickN(onPickA, clamp(event.clientX - colorPicker.clientLeft, 0, 256), 255)
        break
      default:
        if (painting) {
          if (mouseButton === 0 || mouseButton === 2) {
            paint()
          } else {
            eyeDropper3D()
          }
        }
    }
  }

  if (cameraMove && mouseButton === 0) {
    cameraControls(event.movementX, event.movementY)
  }
}

function paint() {
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children)

  if (intersects.length > 0) {
    let intersect
    if (!shift && layer2.visible) {
      intersect = intersects[0]
    } else {
      intersect = intersects[1]

      if (intersect.object === layer2) {
        return
      }
    }
    const x = Math.floor(intersect.uv!.x * 64)
    const y = 64 - Math.floor(intersect.uv!.y * 64) - 1

    layerCTXs[layer]?.clearRect(x, y, 1, 1)

    if (mouseButton === 0) {
      layerCTXs[layer]!.fillStyle = `rgba(${hotbarColors[hotbar].color.r * 255}, ${
        hotbarColors[hotbar].color.g * 255
      }, ${hotbarColors[hotbar].color.b * 255}, ${hotbarColors[hotbar].alpha / 255})`
      layerCTXs[layer]?.fillRect(x, y, 1, 1)
    }

    updateTextureHighlight()
  }
}

function eyeDropper3D() {
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children)

  if (intersects.length > 0) {
    let intersect
    if (!shift && layer2.visible) {
      if (!intersectDrop(intersects[0])) {
        intersectDrop(intersects[1])
      }
    } else {
      intersect = intersects[1]
      intersectDrop(intersect)
    }
  }
}

function intersectDrop(intersect: Intersection): boolean {
  const x = Math.floor(intersect.uv!.x * 64)
  const y = 64 - Math.floor(intersect.uv!.y * 64) - 1

  const c = layerCTXs[layer]?.getImageData(x, y, 1, 1).data

  setAlpha(c![3])
  updateColor('rgb', c![0], c![1], c![2])

  if (hotbarColors[hotbar].alpha === 0) {
    return false
  }
  return true
}

showCanvas.addEventListener('mousemove', onDraw)
function onDraw(this: HTMLElement, event: MouseEvent) {
  drawFromOffset(event.offsetX, event.offsetY)
}

function draw(x: number, y: number) {
  if (prevDraw.x < 0 || prevDraw.y < 0) {
    prevDraw.x = x
    prevDraw.y = y
  }

  clearLine(x, y, prevDraw.x, prevDraw.y)
  if (mouseButton === 0) {
    layerCTXs[layer]!.fillStyle = `rgb(${hotbarColors[hotbar].color.r * 255}, ${hotbarColors[hotbar].color.g * 255}, ${
      hotbarColors[hotbar].color.b * 255
    }, ${hotbarColors[hotbar].alpha / 255})`
    line(x, y, prevDraw.x, prevDraw.y)
    layerCTXs[layer]?.clearRect(x, y, 1, 1)
    layerCTXs[layer]?.fillRect(x, y, 1, 1)
  }

  prevDraw.x = x
  prevDraw.y = y

  updateTextureHighlight()
}

function eyeDropper2D(x: number, y: number) {
  const c = textureCTX?.getImageData(x, y, 1, 1).data

  setAlpha(c![3])
  updateColor('rgb', c![0], c![1], c![2])
}

function clearLine(x: number, y: number, x1: number, y1: number) {
  const distX = x1 - x
  const distY = y1 - y
  const steps = Math.sqrt(distX * distX + distY * distY)

  for (let i = 0; i < steps; i++) {
    layerCTXs[layer]?.clearRect(Math.floor(x + (distX * i) / steps), Math.floor(y + (distY * i) / steps), 1, 1)
  }
}

function line(x: number, y: number, x1: number, y1: number) {
  const distX = x1 - x
  const distY = y1 - y
  const steps = Math.sqrt(distX * distX + distY * distY)

  for (let i = 0; i < steps; i++) {
    layerCTXs[layer]?.fillRect(Math.floor(x + (distX * i) / steps), Math.floor(y + (distY * i) / steps), 1, 1)
  }
}

showCanvas.addEventListener('mousedown', onDrawStart)
function onDrawStart(this: HTMLElement, event: MouseEvent) {
  setMouseButton(event.button)

  if (event.button === 0 || event.button === 1 || event.button === 2) {
    setDrawing(true)

    drawFromOffset(event.offsetX, event.offsetY)
  }
}

document.addEventListener('contextmenu', onContextMenu)
function onContextMenu(event: Event) {
  event.preventDefault()
}

function drawFromOffset(x: number, y: number) {
  setMouseTexture(
    (x * 64) / showCanvas.width / showZoom + zoomPos.x,
    (y * 64) / showCanvas.height / showZoom + zoomPos.y,
  )

  if (drawing) {
    if (mouseButton === 1) {
      eyeDropper2D(Math.floor(mouseTexture.x), Math.floor(mouseTexture.y))
    } else {
      draw(Math.floor(mouseTexture.x), Math.floor(mouseTexture.y))
    }
  }
}

document.addEventListener('wheel', (event: WheelEvent) => {
  if (!event.ctrlKey) {
    setHotbar(wrap(hotbar + (event.deltaY > 0 ? 1 : -1), 0, 8))
  }
})

renderer.domElement.addEventListener('wheel', onZoom3D)
function onZoom3D(event: WheelEvent) {
  if (
    event.ctrlKey &&
    !((camera.position.length() < 1.2 && event.deltaY < 0) || (camera.position.length() > 5 && event.deltaY > 0))
  ) {
    camera.position.multiplyScalar(Math.pow(Math.pow(2, 1 / 4), event.deltaY / 100))
  }

  event.preventDefault()
}

showCanvas.addEventListener('wheel', onZoom)
function onZoom(this: HTMLElement, event: WheelEvent) {
  if (event.ctrlKey) {
    zoom(event.deltaY / -100)
    updateTextureHighlight()
  }

  event.preventDefault()
}

renderer.domElement.addEventListener('mousemove', (_event: MouseEvent) => {
  updateTextureHighlight()
})

renderer.domElement.addEventListener('mousedown', onSceneMouseDown)
function onSceneMouseDown(event: MouseEvent) {
  setMouseButton(event.button)

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children)

  if (!event.ctrlKey && intersects.length > 0) {
    setPainting(true)
    if (event.button === 0 || event.button === 2) {
      paint()
    } else if (event.button === 1) {
      eyeDropper3D()
    }
  } else {
    setCameraMove(true)
  }
}

document.addEventListener('mousedown', onMouseDown)
function onMouseDown(event: MouseEvent) {
  setMouseDown(true)
  setMouseButton(event.button)
}

document.addEventListener('mouseup', onMouseUp)
function onMouseUp(_event: MouseEvent) {
  setCameraMove(false)
  setMouseDown(false)
  setPainting(false)
  setDrawing(false)
  setPicking('')

  prevDraw.x = -1
  prevDraw.y = -1
}

document.addEventListener('keydown', onKeyDown)
function onKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey && event.code === 'KeyS') {
    download()
    event.preventDefault()
  }

  if (event.code === 'Tab') {
    layer2.visible = !layer2.visible
    event.preventDefault()
  }

  if (event.key === 'Shift') {
    setShift(true)
    event.preventDefault()
  }

  updateTextureHighlight()

  keys[event.key] = true
  codes[event.code] = true
}

document.addEventListener('keyup', onKeyUp)
function onKeyUp(event: KeyboardEvent) {
  if (event.key === 'Shift') {
    setShift(false)
  }

  updateTextureHighlight()

  keys[event.key] = false
  codes[event.code] = false
}

document.addEventListener('dragover', (event: DragEvent) => {
  event.preventDefault()
})

const fileReader = new FileReader()
fileReader.addEventListener(
  'load',
  function () {
    textureImage.src = <string>fileReader.result
    setTexture()
  },
  false,
)
document.addEventListener('drop', (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.items) {
    if (event.dataTransfer.items[0].kind === 'file') {
      const file = event.dataTransfer.items[0].getAsFile()
      if (file?.name.endsWith('.png')) {
        fileReader.readAsDataURL(file)
      }
    }
  } else {
    const file = event.dataTransfer!.files[0]
    if (file.name.endsWith('png')) {
      fileReader.readAsDataURL(file)
    }
  }
})

// TODO change event.target to existing variables
saveIcon.addEventListener('mouseenter', (_event: MouseEvent) => {
  saveIcon.src = saveSelected
})
saveIcon.addEventListener('mouseleave', (_event: MouseEvent) => {
  saveIcon.src = saveNormal
})
saveIcon.addEventListener('mousedown', (_event: MouseEvent) => {
  download()
})

hotbarCanvas.addEventListener('mousedown', hotbarClick)

function hotbarClick(event: MouseEvent) {
  const offset = hotbarCanvas.clientWidth * (1 / 184)
  const size = hotbarCanvas.clientWidth * (20 / 184)

  setHotbar(clamp(Math.floor((event.offsetX - offset) / size), 0, 8))
}

window.addEventListener('resize', onWindowResize)
function onWindowResize() {
  setWidth(window.innerWidth)
  setHeight(window.innerHeight)

  renderer.setSize(width, height)

  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

hCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('h')
  onPickN(onPickH, event.offsetX, 360)
})
sCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('s')
  onPickN(onPickS, event.offsetX, 100)
})
lCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('l')
  onPickN(onPickL, event.offsetX, 100)
})

rCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('r')
  onPickN(onPickR, event.offsetX, 255)
})
gCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('g')
  onPickN(onPickG, event.offsetX, 255)
})
bCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('b')
  onPickN(onPickB, event.offsetX, 255)
})
aCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('a')
  onPickN(onPickA, event.offsetX, 255)
})

function onPickN(func: Function, value: number, n: number) {
  func((value * n) / 256)
}

function onPickH(value: number) {
  updateColor('hsl', value, hsl.s, hsl.l)
}

function onPickS(value: number) {
  updateColor('hsl', hsl.h, value, hsl.l)
}

function onPickL(value: number) {
  updateColor('hsl', hsl.h, hsl.s, value)
}

function onPickR(value: number) {
  updateColor('rgb', value, rgb.g, rgb.b)
}

function onPickG(value: number) {
  updateColor('rgb', rgb.r, value, rgb.b)
}

function onPickB(value: number) {
  updateColor('rgb', rgb.r, rgb.g, value)
}

function onPickA(value: number) {
  setAlpha(Math.floor(value))
  updateColor('rgb', rgb.r, rgb.g, rgb.b)
}

// TODO convert target to this: HTMLElement
document.getElementById('input-h')?.addEventListener('input', inputH)
function inputH(event: Event) {
  onPickH(clamp(Number((<HTMLInputElement>event.target).value), 0, 360))
}

document.getElementById('input-s')?.addEventListener('input', inputS)
function inputS(event: Event) {
  onPickS(clamp(Number((<HTMLInputElement>event.target).value), 0, 100))
}

document.getElementById('input-l')?.addEventListener('input', inputL)
function inputL(event: Event) {
  onPickL(clamp(Number((<HTMLInputElement>event.target).value), 0, 100))
}

document.getElementById('input-r')?.addEventListener('input', inputR)
function inputR(event: Event) {
  onPickR(clamp(Number((<HTMLInputElement>event.target).value), 0, 255))
}

document.getElementById('input-g')?.addEventListener('input', inputG)
function inputG(event: Event) {
  onPickG(clamp(Number((<HTMLInputElement>event.target).value), 0, 255))
}

document.getElementById('input-b')?.addEventListener('input', inputB)
function inputB(event: Event) {
  onPickB(clamp(Number((<HTMLInputElement>event.target).value), 0, 255))
}

document.getElementById('input-a')?.addEventListener('input', inputA)
function inputA(event: Event) {
  onPickA(clamp(Number((<HTMLInputElement>event.target).value), 0, 255))
}

const ups = document.getElementsByClassName('up')
for (const up of ups) {
  up.addEventListener('mousedown', upMouseDown)
  up.addEventListener('mouseenter', (event: Event) => {
    ;(<HTMLImageElement>event.target).src = upSelectedURL
  })
  up.addEventListener('mouseleave', (event: Event) => {
    ;(<HTMLImageElement>event.target).src = upURL
  })
}
const downs = document.getElementsByClassName('down')
for (const down of downs) {
  down.addEventListener('mousedown', downMouseDown)
  down.addEventListener('mouseenter', (event: Event) => {
    ;(<HTMLImageElement>event.target).src = downSelectedURL
  })
  down.addEventListener('mouseleave', (event: Event) => {
    ;(<HTMLImageElement>event.target).src = downURL
  })
  // down.addEventListener('mouseup', downMouseUp)
}

function upMouseDown(event: Event) {
  // ;(<HTMLImageElement>event.target).src = upSelectedURL
  switch ((<HTMLImageElement>event.target).classList[1]) {
    case 'arrow-h':
      onPickH(clamp(hsl.h + 1, 0, 360))
      break
    case 'arrow-s':
      onPickS(clamp(hsl.s + 1, 0, 100))
      break
    case 'arrow-l':
      onPickL(clamp(hsl.l + 1, 0, 100))
      break
    case 'arrow-r':
      onPickR(clamp(rgb.r + 1, 0, 255))
      break
    case 'arrow-g':
      onPickG(clamp(rgb.g + 1, 0, 255))
      break
    case 'arrow-b':
      onPickB(clamp(rgb.b + 1, 0, 255))
      break
    case 'arrow-a':
      onPickA(clamp(hotbarColors[hotbar].alpha + 1, 0, 255))
      break
  }
}
function downMouseDown(event: Event) {
  switch ((<HTMLImageElement>event.target).classList[1]) {
    case 'arrow-h':
      onPickH(clamp(hsl.h - 1, 0, 360))
      break
    case 'arrow-s':
      onPickS(clamp(hsl.s - 1, 0, 100))
      break
    case 'arrow-l':
      onPickL(clamp(hsl.l - 1, 0, 100))
      break
    case 'arrow-r':
      onPickR(clamp(rgb.r - 1, 0, 255))
      break
    case 'arrow-g':
      onPickG(clamp(rgb.g - 1, 0, 255))
      break
    case 'arrow-b':
      onPickB(clamp(rgb.b - 1, 0, 255))
      break
    case 'arrow-a':
      onPickA(clamp(hotbarColors[hotbar].alpha - 1, 0, 255))
      break
  }
}

// TODO alpha colour add to hex
document.getElementById('input-result')?.addEventListener('input', onResultType)
function onResultType(this: HTMLInputElement, _event: Event) {
  updateColor('hex', rgb2hex(this.value, hotbarColors[hotbar].color.getHex()), 0, 0)
}

const imgs = document.getElementsByTagName('img')

// ! FIREFOX DRAG FIX
// loop through fetched images
for (const img of imgs) {
  // and define onmousedown event handler
  img.onmousedown = disableDragging
}

function disableDragging(e: Event) {
  e.preventDefault()
}
