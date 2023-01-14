module.exports = {
  content: [
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./src/pages/**/*.{ts,tsx,js,jsx}",
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./node_modules/@parssa/universal-ui/src/components/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"]
    },
    container: {
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem"
      },
      center: true
    },
    extend: {
      transitionTimingFunction: {
        spring: "cubic-bezier(.175,.885,.32,1.275)"
      },
      keyframes: {
        shake: {
          "10%, 90%": {
            transform: "translate3d(-1px, 0, 0)"
          },
          "20%, 80%": {
            transform: "translate3d(2px, 0, 0)"
          },
          "30%, 50%, 70%": {
            transform: "translate3d(-4px, 0, 0)"
          },
          "40%, 60%": {
            transform: "translate3d(4px, 0, 0)"
          },
          "100%": {
            transform: "translate3d(0, 0, 0)"
          }
        }
      },
      animation: {
        shake: "shake 0.72s cubic-bezier(.36,.07,.19,.97) both"
      }
    }
  },
  variants: {},
  plugins: [require("@parssa/universal-ui/src/plugin")]
};
