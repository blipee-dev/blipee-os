import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import styles from './FormMessage.module.css'

interface FormMessageProps {
  type: 'success' | 'error' | 'info'
  message: string
}

export function FormMessage({ type, message }: FormMessageProps) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <AlertCircle size={20} />
  }

  return (
    <div className={`${styles.message} ${styles[type]}`}>
      <div className={styles.icon}>
        {icons[type]}
      </div>
      <p className={styles.text}>{message}</p>
    </div>
  )
}
