'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './Sidebar.module.css'

const navItems = [
    { label: 'Dashboard', href: '/', icon: '📊' },
    { label: 'Contratos', href: '/contracts', icon: '📝' },
    { label: 'Plantillas', href: '/templates', icon: '📋' },
    { label: 'Obligaciones', href: '/dashboard/reminders', icon: '⏰' },
]

export function Sidebar() {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>⚖️</span>
                <span className={styles.logoText}>ContractOS</span>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className={styles.footer}>
                <div className={styles.userCard}>
                    <div className={styles.avatar}>A</div>
                    <div>
                        <div className={styles.userName}>Admin User</div>
                        <div className={styles.userRole}>Administrador</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
