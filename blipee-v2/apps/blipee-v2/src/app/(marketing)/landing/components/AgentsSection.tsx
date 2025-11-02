'use client'

import styles from '../landing.module.css'
import { agents } from '../content/data'

export function AgentsSection() {
  return (
    <section className={styles.agentsSection} id="agents">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Your <span className={styles.gradientText}>AI Workforce</span>
        </h2>
        <p className={styles.sectionDescription}>
          Meet the 8 autonomous agents that work around the clock, analysing billions of data points,
          predicting outcomes, and taking action before problems become crises.
        </p>
      </div>
      <div className={styles.agentsGrid}>
        {agents.map(agent => (
          <article key={agent.name} className={styles.agentCard}>
            <div className={styles.agentIcon}>{agent.icon}</div>
            <h3 className={styles.agentName}>{agent.name}</h3>
            <p className={styles.agentRole}>{agent.role}</p>
            <p className={styles.agentDescription}>{agent.description}</p>
            {agent.bulletPoints && (
              <ul className={styles.featureList}>
                {agent.bulletPoints.map(point => (
                  <li key={point} className={styles.featureItem}>
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
