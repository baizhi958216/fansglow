import { ref, onMounted, onUnmounted } from 'vue'

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  points: Point[]
  color: string
}

export interface ImageLayer {
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
  rotation: number // in degrees
  opacity: number // 0-1
  scale: number // scale factor
}

export function useCanvas(canvasRef: Ref<HTMLCanvasElement | null>, color: Ref<string>) {
  const strokes = ref<Stroke[]>([])
  const currentStroke = ref<Point[]>([])
  const isDrawing = ref(false)
  const images = ref<ImageLayer[]>([])
  const selectedImageIndex = ref<number | null>(null)
  const isDraggingImage = ref(false)
  const dragOffset = ref<Point>({ x: 0, y: 0 })
  let ctx: CanvasRenderingContext2D | null = null
  let lastCanvasWidth = 0
  let lastCanvasHeight = 0

  const initCanvas = () => {
    if (!canvasRef.value) return

    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()

    const oldWidth = lastCanvasWidth || rect.width
    const oldHeight = lastCanvasHeight || rect.height

    // Set canvas size to match display size
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio

    ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale context to match device pixel ratio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Set canvas background to black
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // If canvas size changed, scale all content
    if (lastCanvasWidth > 0 && lastCanvasHeight > 0 && (oldWidth !== rect.width || oldHeight !== rect.height)) {
      const scaleX = rect.width / oldWidth
      const scaleY = rect.height / oldHeight

      // Scale all stroke points
      strokes.value.forEach(stroke => {
        stroke.points.forEach(point => {
          point.x *= scaleX
          point.y *= scaleY
        })
      })

      // Scale all images
      images.value.forEach(img => {
        img.x *= scaleX
        img.y *= scaleY
        img.width *= scaleX
        img.height *= scaleY
      })
    }

    // Update last canvas size
    lastCanvasWidth = rect.width
    lastCanvasHeight = rect.height

    // Redraw everything
    redrawCanvas()
  }

  const getCanvasPoint = (clientX: number, clientY: number): Point => {
    if (!canvasRef.value) return { x: 0, y: 0 }

    const rect = canvasRef.value.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (clientX: number, clientY: number) => {
    isDrawing.value = true
    const point = getCanvasPoint(clientX, clientY)
    currentStroke.value = [point]
  }

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawing.value || !ctx) return

    const point = getCanvasPoint(clientX, clientY)
    currentStroke.value.push(point)

    // Draw the line segment
    const prevPoint = currentStroke.value[currentStroke.value.length - 2]

    ctx.strokeStyle = color.value
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(prevPoint!.x, prevPoint!.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const endDrawing = () => {
    if (!isDrawing.value) return

    if (currentStroke.value.length > 0) {
      strokes.value.push({
        points: [...currentStroke.value],
        color: color.value
      })
    }

    currentStroke.value = []
    isDrawing.value = false
  }

  const redrawCanvas = () => {
    if (!ctx || !canvasRef.value) return

    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()

    // Clear and fill with black
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw all images first (as background)
    images.value.forEach((img, index) => {
      ctx!.save()

      // Apply opacity
      ctx!.globalAlpha = img.opacity

      // Calculate center point for rotation
      const centerX = img.x + (img.width * img.scale) / 2
      const centerY = img.y + (img.height * img.scale) / 2

      // Move to center, rotate, then draw
      ctx!.translate(centerX, centerY)
      ctx!.rotate((img.rotation * Math.PI) / 180)
      ctx!.scale(img.scale, img.scale)
      ctx!.drawImage(
        img.image,
        -img.width / 2,
        -img.height / 2,
        img.width,
        img.height
      )

      ctx!.restore()

      // Draw selection border if selected
      if (index === selectedImageIndex.value) {
        ctx!.save()
        ctx!.strokeStyle = '#00FF00'
        ctx!.lineWidth = 2
        ctx!.setLineDash([5, 5])
        ctx!.globalAlpha = 1

        // Draw border around transformed image
        ctx!.translate(centerX, centerY)
        ctx!.rotate((img.rotation * Math.PI) / 180)
        ctx!.scale(img.scale, img.scale)
        ctx!.strokeRect(
          -img.width / 2,
          -img.height / 2,
          img.width,
          img.height
        )

        ctx!.restore()
      }
    })

    // Reset global alpha for strokes
    ctx.globalAlpha = 1

    // Redraw all strokes on top
    strokes.value.forEach(stroke => {
      if (stroke.points.length < 2) return

      ctx!.strokeStyle = stroke.color
      ctx!.lineWidth = 5
      ctx!.lineCap = 'round'
      ctx!.lineJoin = 'round'

      ctx!.beginPath()
      ctx!.moveTo(stroke.points[0]!.x, stroke.points[0]!.y)

      for (let i = 1; i < stroke.points.length; i++) {
        ctx!.lineTo(stroke.points[i]!.x, stroke.points[i]!.y)
      }

      ctx!.stroke()
    })
  }

  const undo = () => {
    if (strokes.value.length === 0) return
    strokes.value.pop()
    redrawCanvas()
  }

  const clear = () => {
    strokes.value = []
    images.value = []
    selectedImageIndex.value = null
    redrawCanvas()
  }

  const addImage = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          if (!canvasRef.value) {
            reject(new Error('Canvas not available'))
            return
          }

          const rect = canvasRef.value.getBoundingClientRect()
          const maxWidth = rect.width * 0.5
          const maxHeight = rect.height * 0.5

          let width = img.width
          let height = img.height

          // Scale image to fit within max dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          // Center the image
          const x = (rect.width - width) / 2
          const y = (rect.height - height) / 2

          images.value.push({
            image: img,
            x,
            y,
            width,
            height,
            rotation: 0,
            opacity: 1,
            scale: 1
          })

          redrawCanvas()
          resolve()
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const getImageAtPoint = (point: Point): number | null => {
    // Check images in reverse order (top to bottom)
    for (let i = images.value.length - 1; i >= 0; i--) {
      const img = images.value[i]!

      // Calculate center point
      const centerX = img.x + (img.width * img.scale) / 2
      const centerY = img.y + (img.height * img.scale) / 2

      // Transform point to image's local coordinate system
      const dx = point.x - centerX
      const dy = point.y - centerY

      // Rotate point back
      const angle = (-img.rotation * Math.PI) / 180
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle)
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle)

      // Check if point is within scaled bounds
      const halfWidth = (img.width * img.scale) / 2
      const halfHeight = (img.height * img.scale) / 2

      if (
        Math.abs(rotatedX) <= halfWidth &&
        Math.abs(rotatedY) <= halfHeight
      ) {
        return i
      }
    }
    return null
  }

  const deleteSelectedImage = () => {
    if (selectedImageIndex.value !== null) {
      images.value.splice(selectedImageIndex.value, 1)
      selectedImageIndex.value = null
      redrawCanvas()
    }
  }

  const updateSelectedImageRotation = (rotation: number) => {
    if (selectedImageIndex.value !== null) {
      images.value[selectedImageIndex.value]!.rotation = rotation
      redrawCanvas()
    }
  }

  const updateSelectedImageOpacity = (opacity: number) => {
    if (selectedImageIndex.value !== null) {
      images.value[selectedImageIndex.value]!.opacity = opacity
      redrawCanvas()
    }
  }

  const updateSelectedImageScale = (scale: number) => {
    if (selectedImageIndex.value !== null) {
      const img = images.value[selectedImageIndex.value]!

      // Calculate current center point
      const oldCenterX = img.x + (img.width * img.scale) / 2
      const oldCenterY = img.y + (img.height * img.scale) / 2

      // Update scale
      img.scale = scale

      // Recalculate position to keep center point fixed
      img.x = oldCenterX - (img.width * img.scale) / 2
      img.y = oldCenterY - (img.height * img.scale) / 2

      redrawCanvas()
    }
  }

  const getSelectedImage = (): ImageLayer | null => {
    if (selectedImageIndex.value !== null) {
      return images.value[selectedImageIndex.value] || null
    }
    return null
  }

  const getDataUrl = (): string => {
    if (!canvasRef.value) return ''
    return canvasRef.value.toDataURL('image/png')
  }

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]!
    const point = getCanvasPoint(touch.clientX, touch.clientY)
    const imageIndex = getImageAtPoint(point)

    if (imageIndex !== null) {
      // Start dragging image
      isDraggingImage.value = true
      selectedImageIndex.value = imageIndex
      const img = images.value[imageIndex]!

      // Calculate center point for proper drag offset
      const centerX = img.x + (img.width * img.scale) / 2
      const centerY = img.y + (img.height * img.scale) / 2

      dragOffset.value = {
        x: point.x - centerX,
        y: point.y - centerY
      }
      redrawCanvas()
    } else {
      // Start drawing
      selectedImageIndex.value = null
      startDrawing(touch.clientX, touch.clientY)
      redrawCanvas()
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]!

    if (isDraggingImage.value && selectedImageIndex.value !== null) {
      const point = getCanvasPoint(touch.clientX, touch.clientY)
      const img = images.value[selectedImageIndex.value]!

      // Update position based on center point
      const centerX = point.x - dragOffset.value.x
      const centerY = point.y - dragOffset.value.y

      img.x = centerX - (img.width * img.scale) / 2
      img.y = centerY - (img.height * img.scale) / 2

      redrawCanvas()
    } else {
      draw(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    if (isDraggingImage.value) {
      isDraggingImage.value = false
    } else {
      endDrawing()
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY)
    const imageIndex = getImageAtPoint(point)

    if (imageIndex !== null) {
      // Start dragging image
      isDraggingImage.value = true
      selectedImageIndex.value = imageIndex
      const img = images.value[imageIndex]!

      // Calculate center point for proper drag offset
      const centerX = img.x + (img.width * img.scale) / 2
      const centerY = img.y + (img.height * img.scale) / 2

      dragOffset.value = {
        x: point.x - centerX,
        y: point.y - centerY
      }
      redrawCanvas()
    } else {
      // Start drawing
      selectedImageIndex.value = null
      startDrawing(e.clientX, e.clientY)
      redrawCanvas()
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingImage.value && selectedImageIndex.value !== null) {
      const point = getCanvasPoint(e.clientX, e.clientY)
      const img = images.value[selectedImageIndex.value]!

      // Update position based on center point
      const centerX = point.x - dragOffset.value.x
      const centerY = point.y - dragOffset.value.y

      img.x = centerX - (img.width * img.scale) / 2
      img.y = centerY - (img.height * img.scale) / 2

      redrawCanvas()
    } else {
      draw(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = () => {
    if (isDraggingImage.value) {
      isDraggingImage.value = false
    } else {
      endDrawing()
    }
  }

  onMounted(() => {
    if (!canvasRef.value) return

    const canvas = canvasRef.value

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Mouse events (for desktop testing)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)

    initCanvas()
  })

  onUnmounted(() => {
    if (!canvasRef.value) return

    const canvas = canvasRef.value

    canvas.removeEventListener('touchstart', handleTouchStart)
    canvas.removeEventListener('touchmove', handleTouchMove)
    canvas.removeEventListener('touchend', handleTouchEnd)
    canvas.removeEventListener('mousedown', handleMouseDown)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mouseup', handleMouseUp)
    canvas.removeEventListener('mouseleave', handleMouseUp)
  })

  return {
    strokes,
    isDrawing,
    images,
    selectedImageIndex,
    initCanvas,
    undo,
    clear,
    getDataUrl,
    addImage,
    deleteSelectedImage,
    updateSelectedImageRotation,
    updateSelectedImageOpacity,
    updateSelectedImageScale,
    getSelectedImage
  }
}
