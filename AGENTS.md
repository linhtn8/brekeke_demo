# 🤖 AI Agent Guidelines & System Instructions: Brekeke Phone Demo Project

## 1. Project Overview & Architecture
This repository contains a VoIP/WebRTC softphone prototype comprising two main components:
1. **Frontend (`brekekephone/`)**: A cross-platform application (React Native, React Native Web, iOS, Android) utilizing MobX for state management.
2. **Backend (`BE/signaling-server/`)**: A Node.js WebSocket backend signaling server for WebRTC peer-to-peer connection establishment.

**Flow Documents**:
Always consult the `docs/` folder for architectural and business flows before modifying core features. 
- `docs/ARCHITECTURE_FLOW.md`: General architecture.
- `docs/flow_phase_2.md`: Phase 2 specific data flows.
- `docs/LOCAL_TESTING_GUIDE.md` / `docs/how_to_run.md`: Setup and testing details.

---

## 2. Build, Run & Test Commands

### Frontend (`brekekephone/`)
- **Install Dependencies**: `yarn install` (use `cd ios && pod install` for iOS).
- **Start Metro Bundler**: `yarn rn`
- **Run Android**: `yarn android`
- **Run iOS**: `yarn ios`
- **Run Web**: `yarn start` (Uses `craco start`)
- **Build Web**: `yarn build`
- **Lint Code**: `yarn lint` (Runs ESLint and Prettier over `.js, .ts, .tsx`)
- **Format Code**: `yarn fmt`

**Testing Frontend (CRITICAL)**:
When generating and running tests, agents should manually invoke Jest or the Craco test runner:
- **Run a single test (Web)**: `yarn craco test <FileName>.test.ts`
- **Run a single test (React Native)**: `npx jest <FileName>.test.ts`
- **Run all tests**: `npx jest`

### Backend (`BE/signaling-server/`)
- **Install Dependencies**: `npm install`
- **Start Production**: `npm start`
- **Start Development**: `npm run dev` (uses nodemon for hot-reloading)
- **Lint Code**: `npm run lint` (if available)

**Testing Backend**:
- **Run a single test**: `npx jest <FileName>.test.ts` (or `npx mocha` depending on the test framework found).

---

## 3. Code Style Guidelines

### 3.1 General Principles
- **TypeScript First**: Write strong, explicitly typed TypeScript code for `brekekephone/`. STRICTLY avoid `any`. Define granular interfaces and types.
- **Cross-Platform Compatibility**: UI components in React Native must render gracefully on iOS, Android, and Web (`react-native-web`). Use platform-specific file extensions (`.web.tsx`, `.ios.tsx`) ONLY when absolutely necessary.
- **Functional Paradigms**: Modern React functional components are mandatory. Do not use legacy class components.
- **MobX State Management**: State is managed via MobX. Use observer patterns correctly (`mobx-react`). Mutations should happen within `@action` methods.

### 3.2 File & Folder Structure (`brekekephone/src/`)
- `components/`: Reusable, generic UI components (Buttons, Inputs, Modals).
- `pages/`: Full screen views/pages (e.g., `PageAccountSignIn`, `PageCallManage`).
- `stores/`: MobX store definitions (`demoStore.ts`, `callStore.ts`, etc.).
- `utils/`: Helper functions, pure mathematical/logic utilities.
- `config/`: Application configuration and constants (`demoConfig.ts`).
- `assets/`: Static files (images, icons, fonts).
- `api/`: Network requests and API definitions.

### 3.3 Formatting and Linting
- **Prettier & ESLint**: Respect existing `.eslintrc` and `.prettierrc` setups.
- **Quotes**: Single quotes (`'`) preferred for strings (Prettier default).
- **Indentation**: 2 spaces.
- **Semicolons**: Follow the existing Prettier config (usually no semicolons at the end of statements in modern RN).
- *Rule*: Run `yarn lint` and `yarn fmt` before concluding any feature to ensure no warnings or formatting issues remain.

### 3.4 Import Conventions
Group imports logically with empty lines between groups:
1. React / React Native built-in modules.
2. Third-party packages (`mobx`, `react-native-webrtc`).
3. Internal Aliases/Absolute paths (e.g., `#/components/...` if configured).
4. Relative internal paths (`../`, `./`).
- *Rule*: Avoid excessively deep relative paths (e.g., `../../../../utils/`). Use aliases where possible.

### 3.5 Naming Conventions
- **Variables & Functions**: `camelCase` (e.g., `startMockCall`, `isLoggedIn`).
- **Components & Pages**: `PascalCase` (e.g., `DemoCallScreen.tsx`, `BapLogo.tsx`).
- **Files/Folders**:
  - React component files should be `PascalCase.tsx` (e.g., `Button.tsx`).
  - Utility scripts, hooks, and stores should be `camelCase.ts` (e.g., `demoStore.ts`, `useTheme.ts`).
- **Constants & Enums**: `UPPER_SNAKE_CASE` (e.g., `DEMO_MODE`, `DEMO_CALL_DURATION`).
- **Interfaces/Types**: Prefix with `I` (e.g., `IUser`) or use clear descriptor (e.g., `UserType`).

### 3.6 Error Handling & Stability
- **Async Logic**: Wrap asynchronous logic (`async/await`) in `try/catch` blocks. Do not swallow errors; log them or display user-friendly UI alerts.
- **WebRTC Edge Cases**: Provide descriptive console logs when critical actions fail (e.g., Signaling server connection failure).
- **Resource Cleanup**: When a component unmounts, ALWAYS:
  - Cancel API requests.
  - Clear timers (`setTimeout`/`setInterval`).
  - Properly disconnect WebRTC streams/PeerConnections to prevent memory leaks and battery drain.

### 3.7 WebRTC & Real-time Connectivity Rules
- **Signaling Flow**: Ensure signaling logic strictly adheres to the standard WebRTC flow: `Offer -> Answer -> ICE Candidates` exchange.
- **Permissions**: When working with `react-native-webrtc`, strictly verify the permissions for camera and microphone across all 3 platforms before initiating calls.
- **Resilience**: Treat Socket.io/WebSocket connection drops gracefully. Implement automatic reconnect logic with backoff delays.

---

## 4. Core Mandates for AI Agents

- **Context is King**: Always use search tools (`glob`, `grep`, `read`) to read neighboring files or configuration files (`package.json`, `Makefile`, `variables.ts`) before adding new dependencies or modifying core behaviors.
- **Read Docs First**: Check the `docs/` folder to understand phase flows or architecture logic before refactoring.
- **Minimal Footprint**: Keep your diffs as small and focused as possible. Do not rewrite files unnecessarily.
- **No Surprises**: If you encounter ambiguity regarding WebRTC logic or MobX store structures, output a clear plan and ask the user before writing or modifying massive files.
- **Proactive Testing**: When writing a new complex utility function, proactively propose writing a `.test.ts` or `.spec.ts` file next to it to verify functionality in isolation. Run the test to prove it works.
- **Verification**: ALWAYS compile the code and run the linter before claiming a task is done. (e.g. `yarn tsc --noEmit` and `yarn lint`).
