"use client"

import * as React from "react"
import * as THREE from "three"

export function PyriteCrystalCanvas({
  className = "",
  interactive = true,
}: {
  className?: string
  interactive?: boolean
}) {
  const mountRef = React.useRef<HTMLDivElement>(null)
  const isHoveredRef = React.useRef(false)
  const mouseRef = React.useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  React.useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Root group for mouse parallax
    const rootGroup = new THREE.Group()
    scene.add(rootGroup)

    // Palette Colors
    const goldColor = new THREE.Color("#F59E0B") // Pyrite Gold
    const crimsonColor = new THREE.Color("#EF4444") // Threat Crimson
    const ironColor = new THREE.Color("#9A9891") // Iron Muted
    const currentLineColor = goldColor.clone()

    // 1. Pyrite Central Crystal: Intersecting Polyhedron / Nested Cube Wireframe
    const cubeGeo1 = new THREE.BoxGeometry(1.6, 1.6, 1.6)
    const cubeEdges1 = new THREE.EdgesGeometry(cubeGeo1)
    const crystalMat = new THREE.LineBasicMaterial({
      color: currentLineColor,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.85,
    })
    const crystalMesh1 = new THREE.LineSegments(cubeEdges1, crystalMat)
    rootGroup.add(crystalMesh1)

    // Second tilted crystal (striated Pyrite habit)
    const cubeGeo2 = new THREE.BoxGeometry(1.4, 1.4, 1.4)
    const cubeEdges2 = new THREE.EdgesGeometry(cubeGeo2)
    const crystalMat2 = new THREE.LineBasicMaterial({
      color: currentLineColor,
      linewidth: 1,
      transparent: true,
      opacity: 0.65,
    })
    const crystalMesh2 = new THREE.LineSegments(cubeEdges2, crystalMat2)
    crystalMesh2.rotation.x = Math.PI / 4
    crystalMesh2.rotation.y = Math.PI / 4
    rootGroup.add(crystalMesh2)

    // Inner octahedron core
    const octGeo = new THREE.OctahedronGeometry(0.85, 0)
    const octEdges = new THREE.EdgesGeometry(octGeo)
    const octMat = new THREE.LineBasicMaterial({
      color: goldColor,
      transparent: true,
      opacity: 0.9,
    })
    const octMesh = new THREE.LineSegments(octEdges, octMat)
    rootGroup.add(octMesh)

    // 2. Concentric 4-Ring Labyrinth Rings (Chakravyuh)
    const ringRadii = [1.5, 2.0, 2.45, 2.9]
    const rings: THREE.Line[] = []

    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.BufferGeometry()
      const segments = 64
      const points: THREE.Vector3[] = []
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0))
      }
      ringGeo.setFromPoints(points)

      const ringMat = new THREE.LineBasicMaterial({
        color: idx === 3 ? crimsonColor : ironColor,
        transparent: true,
        opacity: idx === 3 ? 0.45 : 0.25,
      })
      const ringMesh = new THREE.Line(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 3 + idx * 0.15
      ringMesh.rotation.y = (idx * Math.PI) / 6
      rootGroup.add(ringMesh)
      rings.push(ringMesh)
    })

    // 3. Telemetry Particle Cloud (FeS₂ atoms & attacker probes)
    const particleCount = 120
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleSpeeds = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 1.3 + Math.random() * 2.0
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      particlePositions[i * 3 + 2] = radius * Math.cos(phi)
      particleSpeeds[i] = 0.5 + Math.random() * 1.5
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    )

    const particleMat = new THREE.PointsMaterial({
      color: goldColor,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    })
    const particleSystem = new THREE.Points(particleGeo, particleMat)
    rootGroup.add(particleSystem)

    // Mouse parallax tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      mouseRef.current.targetX = nx * 0.6
      mouseRef.current.targetY = ny * 0.6
    }

    const handleMouseEnter = () => {
      isHoveredRef.current = true
    }

    const handleMouseLeave = () => {
      isHoveredRef.current = false
      mouseRef.current.targetX = 0
      mouseRef.current.targetY = 0
    }

    if (interactive) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    // Resize handler
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    // Animation Loop
    let animationId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

      // Dynamic Color Shift: Gold when calm, Threat Crimson on hover
      const targetColor = isHoveredRef.current ? crimsonColor : goldColor
      currentLineColor.lerp(targetColor, 0.08)
      crystalMat.color.copy(currentLineColor)
      crystalMat2.color.copy(currentLineColor)
      particleMat.color.copy(currentLineColor)

      // Rotations
      crystalMesh1.rotation.x = elapsed * 0.25 + mouseRef.current.y * 0.4
      crystalMesh1.rotation.y = elapsed * 0.35 + mouseRef.current.x * 0.4

      crystalMesh2.rotation.x = -elapsed * 0.18 + mouseRef.current.y * 0.3
      crystalMesh2.rotation.y = elapsed * 0.22 + mouseRef.current.x * 0.3

      octMesh.rotation.y = -elapsed * 0.45
      octMesh.rotation.z = elapsed * 0.15

      // Animate Labyrinth Rings
      rings.forEach((ring, idx) => {
        ring.rotation.z = elapsed * (0.15 * (idx % 2 === 0 ? 1 : -1))
        ring.rotation.x = Math.PI / 3 + idx * 0.15 + mouseRef.current.y * 0.2
      })

      // Orbiting particles
      const positions = particleGeo.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const speed = particleSpeeds[i] * 0.005
        const x = positions[i * 3]
        const z = positions[i * 3 + 2]
        positions[i * 3] = x * Math.cos(speed) - z * Math.sin(speed)
        positions[i * 3 + 2] = x * Math.sin(speed) + z * Math.cos(speed)
      }
      particleGeo.attributes.position.needsUpdate = true

      // Parallax root group tilt
      rootGroup.rotation.y = mouseRef.current.x * 0.35
      rootGroup.rotation.x = -mouseRef.current.y * 0.35

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
      if (interactive) {
        container.removeEventListener("mousemove", handleMouseMove)
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
      renderer.dispose()
      cubeGeo1.dispose()
      cubeGeo2.dispose()
      octGeo.dispose()
      particleGeo.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [interactive])

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[280px] pointer-events-auto cursor-grab active:cursor-grabbing ${className}`}
      title="3D Pyrite Crystal Core // Click & Hover to interact"
    />
  )
}
