import React, { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

interface ThemeContextData {
    theme: Theme;
    toggleTheme: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

const VIEW_TRANSITION_DURATION_MS = 600;
const VIEW_TRANSITION_EASING = "cubic-bezier(.76,.32,.29,.99)";

function getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Aplica o tema de forma síncrona no DOM e persiste a preferência. */
function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
}

function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** View Transitions API ainda fora do lib.dom em algumas versões do TypeScript. */
interface ViewTransitionLike {
    ready: Promise<void>;
}

function startViewTransition(callback: () => void): ViewTransitionLike | null {
    if (!("startViewTransition" in document)) return null;
    const starter = (
        document as Document & {
            startViewTransition: (callback: () => void) => ViewTransitionLike;
        }
    ).startViewTransition;
    return starter.call(document, callback);
}

export function ThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    function toggleTheme(origin?: { x: number; y: number }) {
        const next: Theme = theme === "light" ? "dark" : "light";

        const applyNext = () => {
            // flushSync: o DOM precisa estar no tema novo quando o callback
            // da View Transitions API retornar.
            flushSync(() => {
                setTheme(next);
                applyTheme(next);
            });
        };

        const reduced = prefersReducedMotion();
        const transition = origin && !reduced ? startViewTransition(applyNext) : null;

        if (!transition) {
            applyNext();
            return;
        }

        const { x, y } = origin!;
        const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y),
        );

        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${radius}px at ${x}px ${y}px)`,
                    ],
                },
                {
                    duration: VIEW_TRANSITION_DURATION_MS,
                    easing: VIEW_TRANSITION_EASING,
                    pseudoElement: "::view-transition-new(root)",
                },
            );
        });
    }

    return (
        <ThemeContext.Provider
            value={{
                theme,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme deve ser utilizado dentro de ThemeProvider"
        );
    }

    return context;
}
