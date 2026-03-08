

## Plan: Set dog image as logo and rename to "SHAP ReqEase"

### Changes

1. **Copy uploaded image to project** — Copy `user-uploads://image-10.png` to `src/assets/logo.png`

2. **Update `src/config/constants.ts`** — Change `APP_NAME` from `"REQEASE"` to `"SHAP REQEASE"` and remove the `APP_LOGO_URL` constant (since we'll use an imported asset instead)

3. **Update `src/components/Navbar.tsx`** — Import logo from `@/assets/logo.png`, use it for the img src, change displayed text from "ReqEase" to "SHAP ReqEase"

4. **Update `src/components/LoginPage.tsx`** — Import logo from `@/assets/logo.png`, use it for the img src

5. **Update `index.html`** — Change title to `"SHAP REQEASE | Science Lab Reservations"`

