import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface CommitmentVisual {
  name: string
  amount: number
  frequency: 'Monthly' | 'Quarterly' | 'Annual'
}

interface GoalVisual {
  name: string
  target: number
  current: number
  monthlyContribution: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface Financial3DCanvasProps {
  step: number
  income: number
  spending: number
  commitments: CommitmentVisual[]
  goals: GoalVisual[]
  emergencySavings: number
  preference: string
  isSynchronized?: boolean
}

export default function Financial3DCanvas({
  step,
  income,
  spending,
  commitments,
  goals,
  emergencySavings,
  preference,
  isSynchronized = false,
}: Financial3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  // References for live props so animation loop always reads freshest state without restarting scene
  const stateRef = useRef({
    step,
    income,
    spending,
    commitments,
    goals,
    emergencySavings,
    preference,
    isSynchronized,
  })

  useEffect(() => {
    stateRef.current = {
      step,
      income,
      spending,
      commitments,
      goals,
      emergencySavings,
      preference,
      isSynchronized,
    }
  }, [step, income, spending, commitments, goals, emergencySavings, preference, isSynchronized])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0B0D10, 0.045)

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 0, 14)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)

    // Studio Lighting - Warm Obsidian & Antique Gold Palette
    const ambientLight = new THREE.AmbientLight(0x1D1814, 1.6)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xF5EDE2, 1.9)
    keyLight.position.set(6, 8, 10)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xC49A5A, 1.2)
    fillLight.position.set(-8, -4, -6)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(0xB88A44, 1.3, 20)
    rimLight.position.set(0, 5, -4)
    scene.add(rimLight)

    // Master Group for mouse parallax & subtle tilt
    const rootGroup = new THREE.Group()
    scene.add(rootGroup)

    // ==========================================
    // 1. STEP 1: Flowing Stream & Income Orbit
    // ==========================================
    const streamGroup = new THREE.Group()
    rootGroup.add(streamGroup)

    // Stream particle curves
    const streamParticleCount = 450
    const streamGeometry = new THREE.BufferGeometry()
    const streamPositions = new Float32Array(streamParticleCount * 3)
    const streamOriginals = new Float32Array(streamParticleCount * 3)
    const streamSpeeds = new Float32Array(streamParticleCount)
    const streamColors = new Float32Array(streamParticleCount * 3)

    const goldPrimary = new THREE.Color(0xC49A5A)
    const goldChampagne = new THREE.Color(0xD2B477)
    const creamAccent = new THREE.Color(0xF5EDE2)

    for (let i = 0; i < streamParticleCount; i++) {
      const u = i / streamParticleCount
      const radius = 2.4 + Math.sin(u * Math.PI * 4) * 0.8
      const angle = u * Math.PI * 8
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5
      const y = (u - 0.5) * 8 + (Math.random() - 0.5) * 0.4
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5

      streamPositions[i * 3] = x
      streamPositions[i * 3 + 1] = y
      streamPositions[i * 3 + 2] = z

      streamOriginals[i * 3] = x
      streamOriginals[i * 3 + 1] = y
      streamOriginals[i * 3 + 2] = z

      streamSpeeds[i] = 0.4 + Math.random() * 0.8

      const mixColor = i % 4 === 0 ? creamAccent : i % 2 === 0 ? goldPrimary : goldChampagne
      streamColors[i * 3] = mixColor.r
      streamColors[i * 3 + 1] = mixColor.g
      streamColors[i * 3 + 2] = mixColor.b
    }

    streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3))
    streamGeometry.setAttribute('color', new THREE.BufferAttribute(streamColors, 3))

    const streamMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    })
    const streamPoints = new THREE.Points(streamGeometry, streamMaterial)
    streamGroup.add(streamPoints)

    // Central Core Geometries
    const coreGroup = new THREE.Group()
    rootGroup.add(coreGroup)

    const innerCoreGeo = new THREE.IcosahedronGeometry(1.1, 1)
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x171310,
      emissive: 0xC49A5A,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: true,
    })
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat)
    coreGroup.add(innerCoreMesh)

    const coreTorusGeo = new THREE.TorusGeometry(1.8, 0.02, 16, 100)
    const coreTorusMat = new THREE.MeshBasicMaterial({
      color: 0xC49A5A,
      transparent: true,
      opacity: 0.5,
    })
    const coreTorus = new THREE.Mesh(coreTorusGeo, coreTorusMat)
    coreTorus.rotation.x = Math.PI / 3
    coreGroup.add(coreTorus)

    const coreTorus2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.015, 16, 100),
      new THREE.MeshBasicMaterial({
        color: 0xB88A44,
        transparent: true,
        opacity: 0.35,
      })
    )
    coreTorus2.rotation.y = Math.PI / 4
    coreGroup.add(coreTorus2)

    // ==========================================
    // 2. STEP 2: Spending / Expense Distribution
    // ==========================================
    const spendingGroup = new THREE.Group()
    rootGroup.add(spendingGroup)

    const spendingTorusGeo = new THREE.TorusGeometry(3.0, 0.04, 16, 80)
    const spendingTorusMat = new THREE.MeshStandardMaterial({
      color: 0x241E18,
      emissive: 0xC49A5A,
      emissiveIntensity: 0.3,
      roughness: 0.3,
    })
    const spendingTorus = new THREE.Mesh(spendingTorusGeo, spendingTorusMat)
    spendingTorus.rotation.x = Math.PI / 2.2
    spendingGroup.add(spendingTorus)

    // Distribution Nodes
    const spendingNodes: THREE.Mesh[] = []
    const categoryColors = [0xC49A5A, 0xD2B477, 0x98111E, 0x065F46, 0xF5EDE2]
    for (let i = 0; i < 5; i++) {
      const nodeGeo = new THREE.SphereGeometry(0.22, 16, 16)
      const nodeMat = new THREE.MeshStandardMaterial({
        color: categoryColors[i],
        emissive: categoryColors[i],
        emissiveIntensity: 0.35,
        roughness: 0.25,
      })
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat)
      const theta = (i / 5) * Math.PI * 2
      nodeMesh.position.set(Math.cos(theta) * 3.0, Math.sin(theta) * 0.4, Math.sin(theta) * 3.0)
      spendingNodes.push(nodeMesh)
      spendingGroup.add(nodeMesh)
    }

    // ==========================================
    // 3. STEP 3: Commitments & Temporal Timeline
    // ==========================================
    const commitmentsGroup = new THREE.Group()
    rootGroup.add(commitmentsGroup)

    const timelineRing = new THREE.Mesh(
      new THREE.RingGeometry(3.8, 3.84, 90),
      new THREE.MeshBasicMaterial({
        color: 0xD2B477,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      })
    )
    timelineRing.rotation.x = Math.PI / 2
    commitmentsGroup.add(timelineRing)

    const dynamicCommitmentMeshes: THREE.Mesh[] = []

    // ==========================================
    // 4. STEP 4: Goals Constellation
    // ==========================================
    const goalsGroup = new THREE.Group()
    rootGroup.add(goalsGroup)

    const dynamicGoalGroups: THREE.Group[] = []

    // ==========================================
    // 5. STEP 5: Emergency Liquidity Shield
    // ==========================================
    const shieldGroup = new THREE.Group()
    rootGroup.add(shieldGroup)

    const shieldGeo = new THREE.OctahedronGeometry(2.2, 1)
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x241E18,
      emissive: 0xC49A5A,
      emissiveIntensity: 0.35,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    })
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat)
    shieldGroup.add(shieldMesh)

    const shieldOuterRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.02, 16, 100),
      new THREE.MeshBasicMaterial({
        color: 0xB88A44,
        transparent: true,
        opacity: 0.45,
      })
    )
    shieldGroup.add(shieldOuterRing)

    // ==========================================
    // 6. STEP 6: Synchronization Nexus
    // ==========================================
    const syncGroup = new THREE.Group()
    rootGroup.add(syncGroup)

    const syncCore = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.6, 1),
      new THREE.MeshStandardMaterial({
        color: 0x171310,
        emissive: 0xC49A5A,
        emissiveIntensity: 0.65,
        roughness: 0.15,
        metalness: 0.9,
      })
    )
    syncGroup.add(syncCore)

    // Ambient floating particles across full background
    const ambientCount = 200
    const ambientGeo = new THREE.BufferGeometry()
    const ambientPos = new Float32Array(ambientCount * 3)
    for (let i = 0; i < ambientCount * 3; i += 3) {
      ambientPos[i] = (Math.random() - 0.5) * 24
      ambientPos[i + 1] = (Math.random() - 0.5) * 18
      ambientPos[i + 2] = (Math.random() - 0.5) * 16
    }
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPos, 3))
    const ambientParticles = new THREE.Points(
      ambientGeo,
      new THREE.PointsMaterial({
        size: 0.04,
        color: 0xD2B477,
        transparent: true,
        opacity: 0.25,
      })
    )
    scene.add(ambientParticles)

    // Mouse parallax tracking
    let targetMouseX = 0
    let targetMouseY = 0
    let currentMouseX = 0
    let currentMouseY = 0

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const y = -((e.clientY - rect.top) / rect.height - 0.5) * 2
      targetMouseX = x * 0.4
      targetMouseY = y * 0.3
    }

    container.addEventListener('pointermove', handlePointerMove, { passive: true })

    // Reduced motion detection
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Animation Loop
    let animationFrameId: number
    let clock = new THREE.Clock()
    let isVisible = true

    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Render loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (!isVisible) return

      const _delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()
      const { step: curStep, income: curIncome, spending: curSpend, commitments: curComms, goals: curGoals, emergencySavings: curEmergency, isSynchronized: curSync } = stateRef.current

      // Lerp mouse parallax
      currentMouseX += (targetMouseX - currentMouseX) * 0.05
      currentMouseY += (targetMouseY - currentMouseY) * 0.05
      rootGroup.rotation.y = currentMouseX
      rootGroup.rotation.x = currentMouseY

      // Smooth step visibility transitions & layer scales
      const speedMult = prefersReducedMotion ? 0.3 : 1.0

      // Core rotations
      innerCoreMesh.rotation.x += 0.005 * speedMult
      innerCoreMesh.rotation.y += 0.008 * speedMult
      coreTorus.rotation.z += 0.006 * speedMult
      coreTorus2.rotation.x += 0.004 * speedMult

      // --- STEP 1: Income Stream Velocity ---
      const normalizedIncome = Math.max(10000, Math.min(500000, curIncome || 75000))
      const velocityRatio = (normalizedIncome / 75000) * speedMult
      const positions = streamGeometry.attributes.position.array as Float32Array

      for (let i = 0; i < streamParticleCount; i++) {
        const idx = i * 3 + 1
        positions[idx] -= streamSpeeds[i] * 0.04 * velocityRatio
        if (positions[idx] < -4) {
          positions[idx] = 4
        }
      }
      streamGeometry.attributes.position.needsUpdate = true
      streamGroup.rotation.y += 0.003 * velocityRatio

      // Dynamic opacity / presence based on active step
      const isStep1Active = curStep === 1 || curStep === 6
      streamGroup.visible = curStep <= 3 || curStep === 6
      streamMaterial.opacity = THREE.MathUtils.lerp(
        streamMaterial.opacity,
        isStep1Active ? 0.85 : 0.25,
        0.08
      )

      // --- STEP 2: Spending Nodes Orbit ---
      spendingGroup.visible = curStep >= 2
      spendingTorus.rotation.z += 0.004 * speedMult
      const spendRatio = Math.min(1.5, Math.max(0.3, curSpend / (curIncome || 75000)))

      spendingNodes.forEach((node, i) => {
        const theta = (i / spendingNodes.length) * Math.PI * 2 + elapsed * 0.25 * speedMult
        const r = 2.8 + Math.sin(elapsed + i) * 0.2 * spendRatio
        node.position.set(
          Math.cos(theta) * r,
          Math.sin(theta * 2) * 0.35,
          Math.sin(theta) * r
        )
      })

      // --- STEP 3: Commitments Timeline ---
      commitmentsGroup.visible = curStep >= 3
      timelineRing.rotation.z += 0.003 * speedMult

      // Update commitment dynamic node count
      if (curComms.length !== dynamicCommitmentMeshes.length) {
        // Clear previous
        dynamicCommitmentMeshes.forEach(m => commitmentsGroup.remove(m))
        dynamicCommitmentMeshes.length = 0

        // Recreate
        curComms.forEach((c, idx) => {
          const cMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12),
            new THREE.MeshStandardMaterial({
              color: 0x241E18,
              emissive: 0xC49A5A,
              emissiveIntensity: 0.5,
              roughness: 0.25,
            })
          )
          const angle = (idx / Math.max(1, curComms.length)) * Math.PI * 2
          cMesh.position.set(Math.cos(angle) * 3.8, 0, Math.sin(angle) * 3.8)
          cMesh.lookAt(0, 0, 0)
          commitmentsGroup.add(cMesh)
          dynamicCommitmentMeshes.push(cMesh)
        })
      }

      // --- STEP 4: Goals Constellation ---
      goalsGroup.visible = curStep >= 4
      if (curGoals.length !== dynamicGoalGroups.length) {
        dynamicGoalGroups.forEach(g => goalsGroup.remove(g))
        dynamicGoalGroups.length = 0

        curGoals.forEach((goal, idx) => {
          const gGroup = new THREE.Group()
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.26, 16, 16),
            new THREE.MeshStandardMaterial({
              color: goal.priority === 'HIGH' ? 0xC49A5A : 0xB88A44,
              emissive: goal.priority === 'HIGH' ? 0xB88A44 : 0x241E18,
              emissiveIntensity: 0.5,
              roughness: 0.2,
            })
          )
          gGroup.add(sphere)

          // Progress ring
          const progressPct = Math.min(1, Math.max(0, goal.current / (goal.target || 100000)))
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.45, 0.02, 12, 40, Math.PI * 2 * progressPct),
            new THREE.MeshBasicMaterial({ color: 0xD2B477 })
          )
          gGroup.add(ring)

          const angle = (idx / Math.max(1, curGoals.length)) * Math.PI * 2
          gGroup.position.set(Math.cos(angle) * 4.4, Math.sin(idx * 1.5) * 0.8, Math.sin(angle) * 4.4)
          goalsGroup.add(gGroup)
          dynamicGoalGroups.push(gGroup)
        })
      }

      goalsGroup.rotation.y += 0.002 * speedMult

      // --- STEP 5: Emergency Liquidity Shield ---
      shieldGroup.visible = curStep >= 5
      shieldMesh.rotation.y += 0.007 * speedMult
      shieldMesh.rotation.x += 0.004 * speedMult
      shieldOuterRing.rotation.z += 0.005 * speedMult
      const emergencyMonths = curSpend > 0 ? curEmergency / curSpend : 3
      const shieldScale = THREE.MathUtils.clamp(0.8 + emergencyMonths * 0.1, 0.9, 1.8)
      shieldMesh.scale.set(shieldScale, shieldScale, shieldScale)

      // --- STEP 6: Financial Twin Synchronization Core ---
      syncGroup.visible = curStep === 6
      if (curStep === 6) {
        syncCore.rotation.x += 0.012 * speedMult
        syncCore.rotation.y += 0.015 * speedMult
        const pulse = Math.sin(elapsed * 3) * 0.12 + 1.0
        syncCore.scale.set(pulse, pulse, pulse)

        // Convergence of outer groups toward origin
        if (curSync) {
          streamGroup.scale.lerp(new THREE.Vector3(0.3, 0.3, 0.3), 0.05)
          spendingGroup.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.05)
          commitmentsGroup.scale.lerp(new THREE.Vector3(0.6, 0.6, 0.6), 0.05)
          goalsGroup.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.05)
        }
      } else {
        streamGroup.scale.set(1, 1, 1)
        spendingGroup.scale.set(1, 1, 1)
        commitmentsGroup.scale.set(1, 1, 1)
        goalsGroup.scale.set(1, 1, 1)
      }

      renderer.render(scene, camera)
    }

    animate()

    // Resize handling via ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        const height = entry.contentRect.height
        if (width > 0 && height > 0) {
          camera.aspect = width / height
          // Zoom camera slightly out on narrow screens so composition remains visible
          camera.position.z = width < 768 ? 17 : 14
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
        }
      }
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animationFrameId)
      document.removeEventListener('visibilitychange', handleVisibility)
      container.removeEventListener('pointermove', handlePointerMove)
      resizeObserver.disconnect()

      // Cleanup WebGL resources
      streamGeometry.dispose()
      streamMaterial.dispose()
      innerCoreGeo.dispose()
      innerCoreMat.dispose()
      coreTorusGeo.dispose()
      coreTorusMat.dispose()
      spendingTorusGeo.dispose()
      spendingTorusMat.dispose()
      shieldGeo.dispose()
      shieldMat.dispose()
      ambientGeo.dispose()
      renderer.dispose()
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-auto select-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
