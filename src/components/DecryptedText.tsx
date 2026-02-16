import { useEffect, useState, useRef } from 'react'
import { useInView } from 'motion/react'

/**
 * DecryptedText
 *
 * A component that displays text with a "matrix-like" decryption effect.
 *
 * @param {string} text - The text to display.
 * @param {number} speed - The speed of the animation in ms (default: 50).
 * @param {number} maxIterations - Maximum number of iterations for non-sequential reveal (default: 10).
 * @param {boolean} sequential - If true, reveals characters one by one (default: false).
 * @param {string} revealDirection - Direction of reveal: "start", "end", "center" (default: "start").
 * @param {boolean} useOriginalCharsOnly - If true, uses only chars from the original text for scrambling (default: false).
 * @param {string} characters - Custom characters to use for scrambling (default: standard set).
 * @param {string} className - Class name for the revealed character.
 * @param {string} parentClassName - Class name for the container.
 * @param {string} encryptedClassName - Class name for the scrambled character.
 * @param {string} animateOn - Trigger: "view" | "hover" | "both" (default: "hover").
 */

interface DecryptedTextProps {
    text: string
    speed?: number
    maxIterations?: number
    sequential?: boolean
    revealDirection?: 'start' | 'end' | 'center'
    useOriginalCharsOnly?: boolean
    characters?: string
    className?: string
    parentClassName?: string
    encryptedClassName?: string
    animateOn?: 'view' | 'hover' | 'both'
}

export default function DecryptedText({
    text,
    speed = 50,
    maxIterations = 10,
    sequential = false,
    revealDirection = 'start',
    useOriginalCharsOnly = false,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+',
    className = '',
    parentClassName = '',
    encryptedClassName = '',
    animateOn = 'hover',
}: DecryptedTextProps) {
    const [displayText, setDisplayText] = useState<string>(text)

    const [isScrambling, setIsScrambling] = useState<boolean>(false)
    const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const containerRef = useRef<HTMLSpanElement>(null)
    const isInView = useInView(containerRef, { once: true, margin: "-10%" })

    useEffect(() => {
        if (animateOn === 'view' && isInView && !isScrambling && revealedIndices.size === 0) {
            scramble()
        } else if (animateOn === 'both' && isInView && !isScrambling && revealedIndices.size === 0) {
            scramble()
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isInView, animateOn])

    const scramble = () => {
        if (isScrambling) return

        setIsScrambling(true)
        setRevealedIndices(new Set())

        const length = text.length
        let currentIteration = 0
        let revealedCount = 0

        // For sequential, we need to know the order of indices to reveal
        const revealOrder = getRevealOrder(length, revealDirection)

        if (intervalRef.current) clearInterval(intervalRef.current)

        intervalRef.current = setInterval(() => {
            let newRevealedIndices = new Set(revealedIndices)
            let allRevealed = false

            if (sequential) {
                // Reveal one character at a time (or a few depending on speed/length)
                // Simple sequential: one per tick
                if (revealedCount < length) {
                    const indexToReveal = revealOrder[revealedCount]
                    newRevealedIndices.add(indexToReveal)
                    setRevealedIndices(new Set(newRevealedIndices))
                    revealedCount++
                } else {
                    allRevealed = true
                }
            } else {
                // Random reveal
                // Logic: each tick, we might reveal some characters based on maxIterations
                // Or we just update the scrambled text and slowly add to revealed
                // Let's use a simpler approach for non-sequential:
                // Just scramble everything not revealed, and randomly reveal some.
                // But to match "maxIterations" logic often used:
                currentIteration++

                if (currentIteration >= maxIterations) {
                    allRevealed = true
                } else {
                    // Randomly pick some to reveal
                    const unrevealed = text.split('').map((_, i) => i).filter(i => !newRevealedIndices.has(i))
                    // Reveal a chunk
                    const amountToReveal = Math.ceil(unrevealed.length / (maxIterations - currentIteration + 1))
                    // Shuffle unrevealed to pick random ones
                    const shuffled = [...unrevealed].sort(() => Math.random() - 0.5)
                    const toReveal = shuffled.slice(0, amountToReveal)
                    toReveal.forEach(i => newRevealedIndices.add(i))
                    setRevealedIndices(new Set(newRevealedIndices))
                }
            }

            // Generate display text
            const nextText = text
                .split('')
                .map((originalChar, i) => {
                    if (newRevealedIndices.has(i) || originalChar === ' ') {
                        return originalChar
                    }

                    // Return random char
                    if (useOriginalCharsOnly) {
                        const randomOriginal = text[Math.floor(Math.random() * length)]
                        return randomOriginal
                    }
                    return characters[Math.floor(Math.random() * characters.length)]
                })
                .join('')

            setDisplayText(nextText)

            if (allRevealed || (sequential && revealedCount >= length) || (!sequential && currentIteration >= maxIterations && newRevealedIndices.size === length)) {
                clearInterval(intervalRef.current!)
                setIsScrambling(false)
                setDisplayText(text) // Ensure final text is correct
                setRevealedIndices(new Set(text.split('').map((_, i) => i)))
            }

        }, speed)
    }

    const getRevealOrder = (length: number, direction: 'start' | 'end' | 'center'): number[] => {
        const indices = Array.from({ length }, (_, i) => i)
        if (direction === 'start') return indices
        if (direction === 'end') return indices.reverse()
        if (direction === 'center') {
            // 0 1 2 3 4 -> 2 1 3 0 4 (approximate center outward)
            // or strictly center
            const center = Math.floor(length / 2)
            const result = [center]
            let left = center - 1
            let right = center + 1
            while (left >= 0 || right < length) {
                if (left >= 0) result.push(left--)
                if (right < length) result.push(right++)
            }
            return result
        }
        return indices
    }

    const handleMouseEnter = () => {
        if ((animateOn === 'hover' || animateOn === 'both') && !isScrambling) {
            scramble()
        }
    }

    const handleMouseLeave = () => {
        // no-op
    }

    return (
        <span
            ref={containerRef}
            className={`inline-block whitespace-nowrap ${parentClassName}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {displayText.split('').map((char, index) => {
                    const isRevealed = revealedIndices.has(index) || char === ' ' || isScrambling === false

                    return (
                        <span
                            key={index}
                            className={isRevealed ? className : encryptedClassName}
                        >
                            {char}
                        </span>
                    )
                })}
            </span>
        </span>
    )
}
