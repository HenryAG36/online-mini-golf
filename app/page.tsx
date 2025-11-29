'use client'

import { useState } from 'react'
import styles from './page.module.css'
import Game from '@/components/Game'

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(0)

  const courses = [
    { name: 'Neon Dreams', difficulty: 'Easy', holes: 3 },
    { name: 'Cyber Circuit', difficulty: 'Medium', holes: 3 },
    { name: 'Void Walker', difficulty: 'Hard', holes: 3 },
  ]

  if (gameStarted) {
    return <Game courseIndex={selectedCourse} onBack={() => setGameStarted(false)} />
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.golfBall}></div>
            <h1 className="game-title fade-in">Neon Golf</h1>
          </div>
          <p className={`${styles.subtitle} fade-in delay-1`}>
            Experience mini-golf in a whole new dimension
          </p>
        </div>

        <div className={`${styles.courseSelection} fade-in delay-2`}>
          <h2 className={styles.sectionTitle}>Select Course</h2>
          <div className={styles.courseGrid}>
            {courses.map((course, index) => (
              <button
                key={index}
                className={`${styles.courseCard} ${selectedCourse === index ? styles.selected : ''}`}
                onClick={() => setSelectedCourse(index)}
              >
                <div className={styles.courseIcon}>
                  <span className={styles.holeNumber}>{index + 1}</span>
                </div>
                <h3 className={styles.courseName}>{course.name}</h3>
                <div className={styles.courseInfo}>
                  <span className={`${styles.difficulty} ${styles[course.difficulty.toLowerCase()]}`}>
                    {course.difficulty}
                  </span>
                  <span className={styles.holes}>{course.holes} Holes</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button 
          className={`${styles.playButton} fade-in delay-3`}
          onClick={() => setGameStarted(true)}
        >
          <span className={styles.playText}>Start Game</span>
          <div className={styles.playGlow}></div>
        </button>

        <div className={`${styles.instructions} fade-in delay-4`}>
          <h3>How to Play</h3>
          <ul>
            <li>Click and drag from the ball to aim</li>
            <li>Release to shoot - longer drag = more power</li>
            <li>Get the ball in the hole in as few strokes as possible</li>
          </ul>
        </div>
      </div>

      <div className={styles.decorations}>
        <div className={styles.orb1}></div>
        <div className={styles.orb2}></div>
        <div className={styles.orb3}></div>
      </div>
    </main>
  )
}
