import {
  cameraControls,
  cameraMove,
  mouse,
  mouseButton,
  mouseDown,
  painting,
  picking,
  setCameraMove,
  setMouseButton,
  setMouseDown,
  setPainting,
  setPicking,
  setShift,
  shift,
} from './input'
import {
  bCanvas,
  camera,
  color,
  ctx,
  gCanvas,
  hCanvas,
  height,
  hsl,
  layer2,
  lCanvas,
  rCanvas,
  renderer,
  rgb,
  sCanvas,
  scene,
  setHeight,
  setWidth,
  updateColor,
  updateTexture,
  width,
} from './render'
import { download, raycaster, rgb2hex } from './util'

import upURL from '../res/up_arrow.png'
import upSelectedURL from '../res/up_arrow_selected.png'
import downURL from '../res/down_arrow.png'
import downSelectedURL from '../res/down_arrow_selected.png'
import { clamp } from 'three/src/math/MathUtils'

document.addEventListener('mousemove', onMouseMove)
function onMouseMove(event: MouseEvent) {
  mouse.x = (event.clientX / width) * 2 - 1
  mouse.y = -(event.clientY / height) * 2 + 1

  if (mouseDown && mouseButton === 0) {
    switch (picking) {
      case 'h':
        onPickN(onPickH, clamp(event.clientX, 0, 256), 360)
        break
      case 's':
        onPickN(onPickS, clamp(event.clientX, 0, 256), 100)
        break
      case 'l':
        onPickN(onPickL, clamp(event.clientX, 0, 256), 100)
        break
      case 'r':
        onPickN(onPickR, clamp(event.clientX, 0, 256), 255)
        break
      case 'g':
        onPickN(onPickG, clamp(event.clientX, 0, 256), 255)
        break
      case 'b':
        onPickN(onPickB, clamp(event.clientX, 0, 256), 255)
        break
      default:
        if (painting) {
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
            const y = Math.floor(intersect.uv!.y * 64)

            ctx!.fillStyle = color.getStyle()
            ctx?.fillRect(x, 64 - y - 1, 1, 1)
            updateTexture()
          }
        }
    }
  }

  if (cameraMove && mouseButton === 0) {
    cameraControls(event.movementX, event.movementY)
  }
}

renderer.domElement.addEventListener('mousedown', onSceneMouseDown)
function onSceneMouseDown(_event: MouseEvent) {
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children)

  if (intersects.length > 0) {
    setPainting(true)
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
  setPicking('')

  for (const up of ups) {
    ;(<HTMLImageElement>up).src = upURL
  }
  for (const down of downs) {
    ;(<HTMLImageElement>down).src = downURL
  }
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
}

document.addEventListener('keyup', onKeyUp)
function onKeyUp(event: KeyboardEvent) {
  if (event.key === 'Shift') {
    setShift(false)
  }
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
  onPickN(onPickH, event.x, 360)
})
sCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('s')
  onPickN(onPickS, event.x, 100)
})
lCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('l')
  onPickN(onPickL, event.x, 100)
})

rCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('r')
  onPickN(onPickR, event.x, 255)
})
gCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('g')
  onPickN(onPickG, event.x, 255)
})
bCanvas.addEventListener('mousedown', (event: MouseEvent) => {
  setPicking('b')
  onPickN(onPickB, event.x, 255)
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

const ups = document.getElementsByClassName('up')
for (const up of ups) {
  up.addEventListener('mousedown', upMouseDown)
  up.addEventListener('mouseup', upMouseUp)
}
const downs = document.getElementsByClassName('down')
for (const down of downs) {
  down.addEventListener('mousedown', downMouseDown)
  down.addEventListener('mouseup', downMouseUp)
}

// TODO inc/dec HSLRGB values
function upMouseDown(event: Event) {
  ;(<HTMLImageElement>event.target).src = upSelectedURL
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
  }
}
function upMouseUp(event: Event) {
  ;(<HTMLImageElement>event.target).src = upURL
}
function downMouseDown(event: Event) {
  ;(<HTMLImageElement>event.target).src = downSelectedURL
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
  }
}
function downMouseUp(event: Event) {
  ;(<HTMLImageElement>event.target).src = downURL
}

// TODO hex colour code input/output
document.getElementById('input-result')?.addEventListener('input', onResultType)
function onResultType(this: HTMLInputElement, _event: Event) {
  updateColor('hex', rgb2hex(this.value, color.getHex()), 0, 0)
}

// TODO middle mouse for colour picker

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
