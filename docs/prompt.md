Make sure 

Theory page shows something like this first:
<html lang="en" class="light"><head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- TODO: Set the document title to the name of your application -->
    <title>DriveMy – Malaysian Driving Test Prep</title>
    <meta name="description" content="Interactive web-based driving learning app with realistic JPJ practical exam simulations for Malaysian learners.">
    <meta name="author" content="Ahmad Faiz &amp; Ahmad Adam Danial">

    <meta property="og:title" content="DriveMy – Malaysian Driving Test Prep">
    <meta property="og:description" content="Master your JPJ practical exam with interactive simulations and theory learning.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="/og-image.png">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="/og-image.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&amp;family=Geist:wght@300;400;500;600;700;800;900&amp;family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&amp;display=swap" rel="stylesheet">
    <style>
      .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
    </style>
  <style type="text/css">:where(html[dir="ltr"]),:where([data-sonner-toaster][dir="ltr"]){--toast-icon-margin-start: -3px;--toast-icon-margin-end: 4px;--toast-svg-margin-start: -1px;--toast-svg-margin-end: 0px;--toast-button-margin-start: auto;--toast-button-margin-end: 0;--toast-close-button-start: 0;--toast-close-button-end: unset;--toast-close-button-transform: translate(-35%, -35%)}:where(html[dir="rtl"]),:where([data-sonner-toaster][dir="rtl"]){--toast-icon-margin-start: 4px;--toast-icon-margin-end: -3px;--toast-svg-margin-start: 0px;--toast-svg-margin-end: -1px;--toast-button-margin-start: 0;--toast-button-margin-end: auto;--toast-close-button-start: unset;--toast-close-button-end: 0;--toast-close-button-transform: translate(35%, -35%)}:where([data-sonner-toaster]){position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1: hsl(0, 0%, 99%);--gray2: hsl(0, 0%, 97.3%);--gray3: hsl(0, 0%, 95.1%);--gray4: hsl(0, 0%, 93%);--gray5: hsl(0, 0%, 90.9%);--gray6: hsl(0, 0%, 88.7%);--gray7: hsl(0, 0%, 85.8%);--gray8: hsl(0, 0%, 78%);--gray9: hsl(0, 0%, 56.1%);--gray10: hsl(0, 0%, 52.3%);--gray11: hsl(0, 0%, 43.5%);--gray12: hsl(0, 0%, 9%);--border-radius: 8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:none;z-index:999999999;transition:transform .4s ease}:where([data-sonner-toaster][data-lifted="true"]){transform:translateY(-10px)}@media (hover: none) and (pointer: coarse){:where([data-sonner-toaster][data-lifted="true"]){transform:none}}:where([data-sonner-toaster][data-x-position="right"]){right:var(--offset-right)}:where([data-sonner-toaster][data-x-position="left"]){left:var(--offset-left)}:where([data-sonner-toaster][data-x-position="center"]){left:50%;transform:translate(-50%)}:where([data-sonner-toaster][data-y-position="top"]){top:var(--offset-top)}:where([data-sonner-toaster][data-y-position="bottom"]){bottom:var(--offset-bottom)}:where([data-sonner-toast]){--y: translateY(100%);--lift-amount: calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);filter:blur(0);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:none;overflow-wrap:anywhere}:where([data-sonner-toast][data-styled="true"]){padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px #0000001a;width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}:where([data-sonner-toast]:focus-visible){box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast][data-y-position="top"]){top:0;--y: translateY(-100%);--lift: 1;--lift-amount: calc(1 * var(--gap))}:where([data-sonner-toast][data-y-position="bottom"]){bottom:0;--y: translateY(100%);--lift: -1;--lift-amount: calc(var(--lift) * var(--gap))}:where([data-sonner-toast]) :where([data-description]){font-weight:400;line-height:1.4;color:inherit}:where([data-sonner-toast]) :where([data-title]){font-weight:500;line-height:1.5;color:inherit}:where([data-sonner-toast]) :where([data-icon]){display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}:where([data-sonner-toast][data-promise="true"]) :where([data-icon])>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}:where([data-sonner-toast]) :where([data-icon])>*{flex-shrink:0}:where([data-sonner-toast]) :where([data-icon]) svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}:where([data-sonner-toast]) :where([data-content]){display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;cursor:pointer;outline:none;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}:where([data-sonner-toast]) :where([data-button]):focus-visible{box-shadow:0 0 0 2px #0006}:where([data-sonner-toast]) :where([data-button]):first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}:where([data-sonner-toast]) :where([data-cancel]){color:var(--normal-text);background:rgba(0,0,0,.08)}:where([data-sonner-toast][data-theme="dark"]) :where([data-cancel]){background:rgba(255,255,255,.3)}:where([data-sonner-toast]) :where([data-close-button]){position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast] [data-close-button]{background:var(--gray1)}:where([data-sonner-toast]) :where([data-close-button]):focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast]) :where([data-disabled="true"]){cursor:not-allowed}:where([data-sonner-toast]):hover :where([data-close-button]):hover{background:var(--gray2);border-color:var(--gray5)}:where([data-sonner-toast][data-swiping="true"]):before{content:"";position:absolute;left:-50%;right:-50%;height:100%;z-index:-1}:where([data-sonner-toast][data-y-position="top"][data-swiping="true"]):before{bottom:50%;transform:scaleY(3) translateY(50%)}:where([data-sonner-toast][data-y-position="bottom"][data-swiping="true"]):before{top:50%;transform:scaleY(3) translateY(-50%)}:where([data-sonner-toast][data-swiping="false"][data-removed="true"]):before{content:"";position:absolute;inset:0;transform:scaleY(2)}:where([data-sonner-toast]):after{content:"";position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}:where([data-sonner-toast][data-mounted="true"]){--y: translateY(0);opacity:1}:where([data-sonner-toast][data-expanded="false"][data-front="false"]){--scale: var(--toasts-before) * .05 + 1;--y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}:where([data-sonner-toast])>*{transition:opacity .4s}:where([data-sonner-toast][data-expanded="false"][data-front="false"][data-styled="true"])>*{opacity:0}:where([data-sonner-toast][data-visible="false"]){opacity:0;pointer-events:none}:where([data-sonner-toast][data-mounted="true"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}:where([data-sonner-toast][data-removed="true"][data-front="true"][data-swipe-out="false"]){--y: translateY(calc(var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="false"]){--y: translateY(40%);opacity:0;transition:transform .5s,opacity .2s}:where([data-sonner-toast][data-removed="true"][data-front="false"]):before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y, 0px)) translate(var(--swipe-amount-x, 0px));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width: 600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-theme=light]{--normal-bg: #fff;--normal-border: var(--gray4);--normal-text: var(--gray12);--success-bg: hsl(143, 85%, 96%);--success-border: hsl(145, 92%, 91%);--success-text: hsl(140, 100%, 27%);--info-bg: hsl(208, 100%, 97%);--info-border: hsl(221, 91%, 91%);--info-text: hsl(210, 92%, 45%);--warning-bg: hsl(49, 100%, 97%);--warning-border: hsl(49, 91%, 91%);--warning-text: hsl(31, 92%, 45%);--error-bg: hsl(359, 100%, 97%);--error-border: hsl(359, 100%, 94%);--error-text: hsl(360, 100%, 45%)}[data-sonner-toaster][data-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg: #000;--normal-border: hsl(0, 0%, 20%);--normal-text: var(--gray1)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg: #fff;--normal-border: var(--gray3);--normal-text: var(--gray12)}[data-sonner-toaster][data-theme=dark]{--normal-bg: #000;--normal-bg-hover: hsl(0, 0%, 12%);--normal-border: hsl(0, 0%, 20%);--normal-border-hover: hsl(0, 0%, 25%);--normal-text: var(--gray1);--success-bg: hsl(150, 100%, 6%);--success-border: hsl(147, 100%, 12%);--success-text: hsl(150, 86%, 65%);--info-bg: hsl(215, 100%, 6%);--info-border: hsl(223, 100%, 12%);--info-text: hsl(216, 87%, 65%);--warning-bg: hsl(64, 100%, 6%);--warning-border: hsl(60, 100%, 12%);--warning-text: hsl(46, 87%, 65%);--error-bg: hsl(358, 76%, 10%);--error-border: hsl(357, 89%, 16%);--error-text: hsl(358, 100%, 81%)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success],[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info],[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning],[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error],[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size: 16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:nth-child(1){animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}to{opacity:.15}}@media (prefers-reduced-motion){[data-sonner-toast],[data-sonner-toast]>*,.sonner-loading-bar{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}
</style><style type="text/css" data-vite-dev-id="C:/Users/ASUS/Documents/2026/SEM 2/FYP/Version Controls/Ver 5/jpj-drivemaster-main/jpj-drivemaster-main/src/index.css">*, ::before, ::after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}/*
! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com
*//*
1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
*/

*,
::before,
::after {
  box-sizing: border-box; /* 1 */
  border-width: 0; /* 2 */
  border-style: solid; /* 2 */
  border-color: #e5e7eb; /* 2 */
}

::before,
::after {
  --tw-content: '';
}

/*
1. Use a consistent sensible line-height in all browsers.
2. Prevent adjustments of font size after orientation changes in iOS.
3. Use a more readable tab size.
4. Use the user's configured `sans` font-family by default.
5. Use the user's configured `sans` font-feature-settings by default.
6. Use the user's configured `sans` font-variation-settings by default.
7. Disable tap highlights on iOS
*/

html,
:host {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  -moz-tab-size: 4; /* 3 */
  -o-tab-size: 4;
     tab-size: 4; /* 3 */
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 4 */
  font-feature-settings: normal; /* 5 */
  font-variation-settings: normal; /* 6 */
  -webkit-tap-highlight-color: transparent; /* 7 */
}

/*
1. Remove the margin in all browsers.
2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.
*/

body {
  margin: 0; /* 1 */
  line-height: inherit; /* 2 */
}

/*
1. Add the correct height in Firefox.
2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
3. Ensure horizontal rules are visible by default.
*/

hr {
  height: 0; /* 1 */
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
}

/*
Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
}

/*
Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  text-decoration: inherit;
}

/*
Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
1. Use the user's configured `mono` font-family by default.
2. Use the user's configured `mono` font-feature-settings by default.
3. Use the user's configured `mono` font-variation-settings by default.
4. Correct the odd `em` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* 1 */
  font-feature-settings: normal; /* 2 */
  font-variation-settings: normal; /* 3 */
  font-size: 1em; /* 4 */
}

/*
Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
Prevent `sub` and `sup` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
  border-collapse: collapse; /* 3 */
}

/*
1. Change the font styles in all browsers.
2. Remove the margin in Firefox and Safari.
3. Remove default padding in all browsers.
*/

button,
input,
optgroup,
select,
textarea {
  font-family: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  font-size: 100%; /* 1 */
  font-weight: inherit; /* 1 */
  line-height: inherit; /* 1 */
  letter-spacing: inherit; /* 1 */
  color: inherit; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 3 */
}

/*
Remove the inheritance of text transform in Edge and Firefox.
*/

button,
select {
  text-transform: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Remove default button styles.
*/

button,
input:where([type='button']),
input:where([type='reset']),
input:where([type='submit']) {
  -webkit-appearance: button; /* 1 */
  background-color: transparent; /* 2 */
  background-image: none; /* 2 */
}

/*
Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
Remove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
1. Correct the odd appearance in Chrome and Safari.
2. Correct the outline style in Safari.
*/

[type='search'] {
  -webkit-appearance: textfield; /* 1 */
  outline-offset: -2px; /* 2 */
}

/*
Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Change font properties to `inherit` in Safari.
*/

::-webkit-file-upload-button {
  -webkit-appearance: button; /* 1 */
  font: inherit; /* 2 */
}

/*
Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
Removes the default spacing and border for appropriate elements.
*/

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

/*
Reset default styling for dialogs.
*/
dialog {
  padding: 0;
}

/*
Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
2. Set the default placeholder color to the user's configured gray 400 color.
*/

input::-moz-placeholder, textarea::-moz-placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

input::placeholder,
textarea::placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

/*
Set the default cursor for buttons.
*/

button,
[role="button"] {
  cursor: pointer;
}

/*
Make sure disabled buttons don't get the pointer cursor.
*/
:disabled {
  cursor: default;
}

/*
1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)
2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
   This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}

/*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/* Make elements with the HTML hidden attribute stay hidden by default */
[hidden]:where(:not([hidden="until-found"])) {
  display: none;
}
  :root {
    /* Warm Bone / Off-White background, high contrast charcoal text */
    --background: 40 20% 98%;      /* #FBFBFA */
    --foreground: 0 0% 7%;         /* #111111 */

    --card: 0 0% 100%;             /* #FFFFFF */
    --card-foreground: 0 0% 7%;

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 7%;

    --primary: 0 0% 7%;            /* Charcoal Black for primary */
    --primary-foreground: 0 0% 100%;

    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 7%;

    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 47%;  /* #787774 */

    --accent: 140 20% 96%;         /* Pale Green for subtle accent #EDF3EC */
    --accent-foreground: 120 32% 30%; /* Text #346538 */

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 92%;            /* #EAEAEA */
    --input: 0 0% 92%;
    --ring: 0 0% 7%;               /* Charcoal ring */

    --radius: 0.5rem;              /* Crisp 8px radius */

    --sidebar-background: 40 20% 98%; /* Match background */
    --sidebar-foreground: 0 0% 30%;
    --sidebar-primary: 0 0% 7%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 0 0% 0%;     /* We'll use opacity for accents */
    --sidebar-accent-foreground: 0 0% 7%;
    --sidebar-border: 0 0% 92%;
    --sidebar-ring: 0 0% 7%;

    --success: 120 32% 30%;
    --warning: 38 92% 44%;
    --warning-foreground: 0 0% 9%;
    --info: 210 90% 50%;

    --font-heading: '"Be Vietnam Pro"', sans-serif;
    --font-body: 'Geist', sans-serif;
  }

  .dark {
    /* Pure black OLED feel */
    --background: 0 0% 0%;
    --foreground: 0 0% 96%;
    
    --card: 0 0% 4%;
    --card-foreground: 0 0% 96%;
    
    --popover: 0 0% 4%;
    --popover-foreground: 0 0% 96%;
    
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 4%;
    
    --secondary: 0 0% 10%;
    --secondary-foreground: 0 0% 96%;
    
    --muted: 0 0% 12%;
    --muted-foreground: 0 0% 60%;
    
    --accent: 120 15% 15%;
    --accent-foreground: 120 30% 70%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    
    --border: 0 0% 12%;
    --input: 0 0% 15%;
    --ring: 0 0% 98%;
    
    --sidebar-background: 0 0% 0%;
    --sidebar-foreground: 0 0% 70%;
    --sidebar-primary: 0 0% 98%;
    --sidebar-primary-foreground: 0 0% 4%;
    --sidebar-accent: 0 0% 100%;
    --sidebar-accent-foreground: 0 0% 98%;
    --sidebar-border: 0 0% 12%;
    --sidebar-ring: 0 0% 98%;
    
    --warning: 38 92% 54%;
    --warning-foreground: 0 0% 9%;
  }
  * {
  border-color: hsl(var(--border));
}
  body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  /* ── Global focus ring ── */
  :focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
    border-radius: 0.375rem;
  }
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* ── Tactile button feedback ── */
  button:active:not(:disabled),
  a[role="button"]:active:not(:disabled),
  .btn:active:not(:disabled) {
    transform: scale(0.97);
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  /* Respect reduced-motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
.container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: 2rem;
  padding-left: 2rem;
}
@media (min-width: 1400px) {

  .container {
    max-width: 1400px;
  }
}
/* ── Shared card surface ── */
.glass-card {
  border-radius: 0.75rem;
  border-width: 1px;
  border-color: hsl(var(--border));
  background-color: hsl(var(--card));
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
/* Safe-area bottom padding for notched phones */
.pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
/* Nav item base — 48dp minimum touch target */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
    min-height: 48px;
    min-width: 48px;
}
/* ── Loading skeleton ── */
@keyframes pulse {

  50% {
    opacity: .5;
  }
}
.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: var(--radius);
  background-color: hsl(var(--muted));
}
/* ── Page section header ── */
.section-title {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.05em;
}
/* ── Stat value display ── */
.stat-value {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  --tw-numeric-spacing: tabular-nums;
  font-variant-numeric: var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction);
  line-height: 1;
}
/* ── Caption / small label ── */
.caption {
  font-size: 0.75rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
}
/* ── Eyebrow label ── */
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: hsl(var(--muted-foreground));
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.pointer-events-none {
  pointer-events: none;
}
.pointer-events-auto {
  pointer-events: auto;
}
.visible {
  visibility: visible;
}
.invisible {
  visibility: hidden;
}
.fixed {
  position: fixed;
}
.absolute {
  position: absolute;
}
.relative {
  position: relative;
}
.sticky {
  position: sticky;
}
.-inset-1 {
  inset: -0.25rem;
}
.inset-0 {
  inset: 0px;
}
.inset-x-0 {
  left: 0px;
  right: 0px;
}
.inset-y-0 {
  top: 0px;
  bottom: 0px;
}
.-bottom-10 {
  bottom: -2.5rem;
}
.-bottom-12 {
  bottom: -3rem;
}
.-left-12 {
  left: -3rem;
}
.-right-12 {
  right: -3rem;
}
.-right-6 {
  right: -1.5rem;
}
.-top-12 {
  top: -3rem;
}
.bottom-0 {
  bottom: 0px;
}
.left-0 {
  left: 0px;
}
.left-1 {
  left: 0.25rem;
}
.left-1\/2 {
  left: 50%;
}
.left-2 {
  left: 0.5rem;
}
.left-2\.5 {
  left: 0.625rem;
}
.left-3 {
  left: 0.75rem;
}
.left-3\.5 {
  left: 0.875rem;
}
.left-\[50\%\] {
  left: 50%;
}
.right-0 {
  right: 0px;
}
.right-1 {
  right: 0.25rem;
}
.right-2 {
  right: 0.5rem;
}
.right-3 {
  right: 0.75rem;
}
.right-4 {
  right: 1rem;
}
.top-0 {
  top: 0px;
}
.top-1\.5 {
  top: 0.375rem;
}
.top-1\/2 {
  top: 50%;
}
.top-12 {
  top: 3rem;
}
.top-2 {
  top: 0.5rem;
}
.top-3 {
  top: 0.75rem;
}
.top-3\.5 {
  top: 0.875rem;
}
.top-4 {
  top: 1rem;
}
.top-\[1px\] {
  top: 1px;
}
.top-\[50\%\] {
  top: 50%;
}
.top-\[60\%\] {
  top: 60%;
}
.top-\[73px\] {
  top: 73px;
}
.top-full {
  top: 100%;
}
.z-10 {
  z-index: 10;
}
.z-20 {
  z-index: 20;
}
.z-30 {
  z-index: 30;
}
.z-40 {
  z-index: 40;
}
.z-50 {
  z-index: 50;
}
.z-\[100\] {
  z-index: 100;
}
.z-\[1\] {
  z-index: 1;
}
.-mx-1 {
  margin-left: -0.25rem;
  margin-right: -0.25rem;
}
.-mx-4 {
  margin-left: -1rem;
  margin-right: -1rem;
}
.mx-2 {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
.mx-3\.5 {
  margin-left: 0.875rem;
  margin-right: 0.875rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-0\.5 {
  margin-top: 0.125rem;
  margin-bottom: 0.125rem;
}
.my-1 {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
.my-3 {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}
.-ml-4 {
  margin-left: -1rem;
}
.-mt-4 {
  margin-top: -1rem;
}
.mb-0\.5 {
  margin-bottom: 0.125rem;
}
.mb-1 {
  margin-bottom: 0.25rem;
}
.mb-1\.5 {
  margin-bottom: 0.375rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.mb-5 {
  margin-bottom: 1.25rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.mb-8 {
  margin-bottom: 2rem;
}
.ml-1 {
  margin-left: 0.25rem;
}
.ml-auto {
  margin-left: auto;
}
.mr-1 {
  margin-right: 0.25rem;
}
.mr-2 {
  margin-right: 0.5rem;
}
.mt-0\.5 {
  margin-top: 0.125rem;
}
.mt-1 {
  margin-top: 0.25rem;
}
.mt-1\.5 {
  margin-top: 0.375rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-24 {
  margin-top: 6rem;
}
.mt-3 {
  margin-top: 0.75rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mt-5 {
  margin-top: 1.25rem;
}
.mt-6 {
  margin-top: 1.5rem;
}
.mt-8 {
  margin-top: 2rem;
}
.mt-auto {
  margin-top: auto;
}
.block {
  display: block;
}
.inline-block {
  display: inline-block;
}
.flex {
  display: flex;
}
.inline-flex {
  display: inline-flex;
}
.table {
  display: table;
}
.grid {
  display: grid;
}
.hidden {
  display: none;
}
.aspect-square {
  aspect-ratio: 1 / 1;
}
.aspect-video {
  aspect-ratio: 16 / 9;
}
.size-4 {
  width: 1rem;
  height: 1rem;
}
.h-1 {
  height: 0.25rem;
}
.h-1\.5 {
  height: 0.375rem;
}
.h-10 {
  height: 2.5rem;
}
.h-11 {
  height: 2.75rem;
}
.h-12 {
  height: 3rem;
}
.h-14 {
  height: 3.5rem;
}
.h-16 {
  height: 4rem;
}
.h-2 {
  height: 0.5rem;
}
.h-2\.5 {
  height: 0.625rem;
}
.h-24 {
  height: 6rem;
}
.h-28 {
  height: 7rem;
}
.h-3 {
  height: 0.75rem;
}
.h-3\.5 {
  height: 0.875rem;
}
.h-36 {
  height: 9rem;
}
.h-4 {
  height: 1rem;
}
.h-40 {
  height: 10rem;
}
.h-44 {
  height: 11rem;
}
.h-48 {
  height: 12rem;
}
.h-5 {
  height: 1.25rem;
}
.h-6 {
  height: 1.5rem;
}
.h-64 {
  height: 16rem;
}
.h-7 {
  height: 1.75rem;
}
.h-8 {
  height: 2rem;
}
.h-9 {
  height: 2.25rem;
}
.h-\[1px\] {
  height: 1px;
}
.h-\[280px\] {
  height: 280px;
}
.h-\[var\(--radix-navigation-menu-viewport-height\)\] {
  height: var(--radix-navigation-menu-viewport-height);
}
.h-\[var\(--radix-select-trigger-height\)\] {
  height: var(--radix-select-trigger-height);
}
.h-auto {
  height: auto;
}
.h-full {
  height: 100%;
}
.h-px {
  height: 1px;
}
.h-svh {
  height: 100svh;
}
.max-h-72 {
  max-height: 18rem;
}
.max-h-96 {
  max-height: 24rem;
}
.max-h-\[120px\] {
  max-height: 120px;
}
.max-h-\[300px\] {
  max-height: 300px;
}
.max-h-screen {
  max-height: 100vh;
}
.min-h-0 {
  min-height: 0px;
}
.min-h-\[48px\] {
  min-height: 48px;
}
.min-h-\[56px\] {
  min-height: 56px;
}
.min-h-\[80px\] {
  min-height: 80px;
}
.min-h-\[calc\(100vh-4rem\)\] {
  min-height: calc(100vh - 4rem);
}
.min-h-screen {
  min-height: 100vh;
}
.min-h-svh {
  min-height: 100svh;
}
.w-0 {
  width: 0px;
}
.w-1 {
  width: 0.25rem;
}
.w-10 {
  width: 2.5rem;
}
.w-11 {
  width: 2.75rem;
}
.w-12 {
  width: 3rem;
}
.w-14 {
  width: 3.5rem;
}
.w-16 {
  width: 4rem;
}
.w-2 {
  width: 0.5rem;
}
.w-2\.5 {
  width: 0.625rem;
}
.w-24 {
  width: 6rem;
}
.w-28 {
  width: 7rem;
}
.w-3 {
  width: 0.75rem;
}
.w-3\.5 {
  width: 0.875rem;
}
.w-3\/4 {
  width: 75%;
}
.w-4 {
  width: 1rem;
}
.w-44 {
  width: 11rem;
}
.w-5 {
  width: 1.25rem;
}
.w-52 {
  width: 13rem;
}
.w-6 {
  width: 1.5rem;
}
.w-60 {
  width: 15rem;
}
.w-64 {
  width: 16rem;
}
.w-7 {
  width: 1.75rem;
}
.w-72 {
  width: 18rem;
}
.w-8 {
  width: 2rem;
}
.w-9 {
  width: 2.25rem;
}
.w-\[--sidebar-width\] {
  width: var(--sidebar-width);
}
.w-\[100px\] {
  width: 100px;
}
.w-\[1px\] {
  width: 1px;
}
.w-\[70vw\] {
  width: 70vw;
}
.w-auto {
  width: auto;
}
.w-full {
  width: 100%;
}
.w-max {
  width: -moz-max-content;
  width: max-content;
}
.w-px {
  width: 1px;
}
.min-w-0 {
  min-width: 0px;
}
.min-w-5 {
  min-width: 1.25rem;
}
.min-w-\[12rem\] {
  min-width: 12rem;
}
.min-w-\[240px\] {
  min-width: 240px;
}
.min-w-\[8rem\] {
  min-width: 8rem;
}
.min-w-\[var\(--radix-select-trigger-width\)\] {
  min-width: var(--radix-select-trigger-width);
}
.max-w-2xl {
  max-width: 42rem;
}
.max-w-3xl {
  max-width: 48rem;
}
.max-w-4xl {
  max-width: 56rem;
}
.max-w-5xl {
  max-width: 64rem;
}
.max-w-6xl {
  max-width: 72rem;
}
.max-w-7xl {
  max-width: 80rem;
}
.max-w-\[--skeleton-width\] {
  max-width: var(--skeleton-width);
}
.max-w-\[120px\] {
  max-width: 120px;
}
.max-w-\[240px\] {
  max-width: 240px;
}
.max-w-lg {
  max-width: 32rem;
}
.max-w-max {
  max-width: -moz-max-content;
  max-width: max-content;
}
.max-w-md {
  max-width: 28rem;
}
.max-w-sm {
  max-width: 24rem;
}
.max-w-xs {
  max-width: 20rem;
}
.flex-1 {
  flex: 1 1 0%;
}
.flex-shrink-0 {
  flex-shrink: 0;
}
.shrink-0 {
  flex-shrink: 0;
}
.grow {
  flex-grow: 1;
}
.grow-0 {
  flex-grow: 0;
}
.basis-full {
  flex-basis: 100%;
}
.caption-bottom {
  caption-side: bottom;
}
.border-collapse {
  border-collapse: collapse;
}
.-translate-x-1\/2 {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-x-px {
  --tw-translate-x: -1px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-y-1\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-x-\[-50\%\] {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-x-px {
  --tw-translate-x: 1px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-\[-50\%\] {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-rotate-90 {
  --tw-rotate: -90deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.rotate-45 {
  --tw-rotate: 45deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.rotate-90 {
  --tw-rotate: 90deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.scale-105 {
  --tw-scale-x: 1.05;
  --tw-scale-y: 1.05;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.scale-110 {
  --tw-scale-x: 1.1;
  --tw-scale-y: 1.1;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
@keyframes fade-in {

  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes ping {

  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes pulse {

  50% {
    opacity: .5;
  }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes slide-up-fade {

  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-up-fade {
  animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes spin {

  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.cursor-default {
  cursor: default;
}
.cursor-pointer {
  cursor: pointer;
}
.touch-none {
  touch-action: none;
}
.select-none {
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.snap-x {
  scroll-snap-type: x var(--tw-scroll-snap-strictness);
}
.snap-mandatory {
  --tw-scroll-snap-strictness: mandatory;
}
.snap-center {
  scroll-snap-align: center;
}
.list-disc {
  list-style-type: disc;
}
.list-none {
  list-style-type: none;
}
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.flex-row {
  flex-direction: row;
}
.flex-col {
  flex-direction: column;
}
.flex-col-reverse {
  flex-direction: column-reverse;
}
.flex-wrap {
  flex-wrap: wrap;
}
.flex-nowrap {
  flex-wrap: nowrap;
}
.place-items-center {
  place-items: center;
}
.items-start {
  align-items: flex-start;
}
.items-end {
  align-items: flex-end;
}
.items-center {
  align-items: center;
}
.items-baseline {
  align-items: baseline;
}
.items-stretch {
  align-items: stretch;
}
.justify-start {
  justify-content: flex-start;
}
.justify-end {
  justify-content: flex-end;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.gap-1 {
  gap: 0.25rem;
}
.gap-1\.5 {
  gap: 0.375rem;
}
.gap-2 {
  gap: 0.5rem;
}
.gap-2\.5 {
  gap: 0.625rem;
}
.gap-3 {
  gap: 0.75rem;
}
.gap-4 {
  gap: 1rem;
}
.gap-5 {
  gap: 1.25rem;
}
.gap-6 {
  gap: 1.5rem;
}
.gap-8 {
  gap: 2rem;
}
.space-x-1 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(0.25rem * var(--tw-space-x-reverse));
  margin-left: calc(0.25rem * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-4 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(1rem * var(--tw-space-x-reverse));
  margin-left: calc(1rem * calc(1 - var(--tw-space-x-reverse)));
}
.space-y-1 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.25rem * var(--tw-space-y-reverse));
}
.space-y-1\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.375rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.375rem * var(--tw-space-y-reverse));
}
.space-y-10 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(2.5rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(2.5rem * var(--tw-space-y-reverse));
}
.space-y-2 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.5rem * var(--tw-space-y-reverse));
}
.space-y-2\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.625rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.625rem * var(--tw-space-y-reverse));
}
.space-y-3 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.75rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.75rem * var(--tw-space-y-reverse));
}
.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1rem * var(--tw-space-y-reverse));
}
.space-y-5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1.25rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1.25rem * var(--tw-space-y-reverse));
}
.space-y-6 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1.5rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1.5rem * var(--tw-space-y-reverse));
}
.overflow-auto {
  overflow: auto;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-x-auto {
  overflow-x: auto;
}
.overflow-y-auto {
  overflow-y: auto;
}
.overflow-x-hidden {
  overflow-x: hidden;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.whitespace-nowrap {
  white-space: nowrap;
}
.break-words {
  overflow-wrap: break-word;
}
.rounded {
  border-radius: 0.25rem;
}
.rounded-2xl {
  border-radius: 1rem;
}
.rounded-3xl {
  border-radius: 1.5rem;
}
.rounded-\[2px\] {
  border-radius: 2px;
}
.rounded-\[inherit\] {
  border-radius: inherit;
}
.rounded-full {
  border-radius: 9999px;
}
.rounded-lg {
  border-radius: var(--radius);
}
.rounded-md {
  border-radius: calc(var(--radius) - 2px);
}
.rounded-sm {
  border-radius: calc(var(--radius) - 4px);
}
.rounded-xl {
  border-radius: 0.75rem;
}
.rounded-r-md {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.rounded-t-\[10px\] {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}
.rounded-tl-sm {
  border-top-left-radius: calc(var(--radius) - 4px);
}
.border {
  border-width: 1px;
}
.border-0 {
  border-width: 0px;
}
.border-2 {
  border-width: 2px;
}
.border-4 {
  border-width: 4px;
}
.border-\[1\.5px\] {
  border-width: 1.5px;
}
.border-y {
  border-top-width: 1px;
  border-bottom-width: 1px;
}
.border-b {
  border-bottom-width: 1px;
}
.border-l {
  border-left-width: 1px;
}
.border-l-2 {
  border-left-width: 2px;
}
.border-r {
  border-right-width: 1px;
}
.border-t {
  border-top-width: 1px;
}
.border-dashed {
  border-style: dashed;
}
.border-none {
  border-style: none;
}
.border-\[--color-border\] {
  border-color: var(--color-border);
}
.border-accent {
  border-color: hsl(var(--accent));
}
.border-accent\/20 {
  border-color: hsl(var(--accent) / 0.2);
}
.border-accent\/30 {
  border-color: hsl(var(--accent) / 0.3);
}
.border-accent\/40 {
  border-color: hsl(var(--accent) / 0.4);
}
.border-background\/20 {
  border-color: hsl(var(--background) / 0.2);
}
.border-blue-500\/20 {
  border-color: rgb(59 130 246 / 0.2);
}
.border-border {
  border-color: hsl(var(--border));
}
.border-border\/50 {
  border-color: hsl(var(--border) / 0.5);
}
.border-border\/60 {
  border-color: hsl(var(--border) / 0.6);
}
.border-border\/80 {
  border-color: hsl(var(--border) / 0.8);
}
.border-current {
  border-color: currentColor;
}
.border-destructive {
  border-color: hsl(var(--destructive));
}
.border-destructive\/10 {
  border-color: hsl(var(--destructive) / 0.1);
}
.border-destructive\/20 {
  border-color: hsl(var(--destructive) / 0.2);
}
.border-destructive\/30 {
  border-color: hsl(var(--destructive) / 0.3);
}
.border-destructive\/50 {
  border-color: hsl(var(--destructive) / 0.5);
}
.border-green-500 {
  --tw-border-opacity: 1;
  border-color: rgb(34 197 94 / var(--tw-border-opacity, 1));
}
.border-green-500\/30 {
  border-color: rgb(34 197 94 / 0.3);
}
.border-input {
  border-color: hsl(var(--input));
}
.border-muted {
  border-color: hsl(var(--muted));
}
.border-primary {
  border-color: hsl(var(--primary));
}
.border-primary\/20 {
  border-color: hsl(var(--primary) / 0.2);
}
.border-primary\/30 {
  border-color: hsl(var(--primary) / 0.3);
}
.border-primary\/45 {
  border-color: hsl(var(--primary) / 0.45);
}
.border-sidebar-border {
  border-color: hsl(var(--sidebar-border));
}
.border-transparent {
  border-color: transparent;
}
.border-warning\/20 {
  border-color: hsl(var(--warning) / 0.2);
}
.border-warning\/30 {
  border-color: hsl(var(--warning) / 0.3);
}
.border-warning\/40 {
  border-color: hsl(var(--warning) / 0.4);
}
.border-l-transparent {
  border-left-color: transparent;
}
.border-t-transparent {
  border-top-color: transparent;
}
.bg-\[\#2d5a27\] {
  --tw-bg-opacity: 1;
  background-color: rgb(45 90 39 / var(--tw-bg-opacity, 1));
}
.bg-\[--color-bg\] {
  background-color: var(--color-bg);
}
.bg-accent {
  background-color: hsl(var(--accent));
}
.bg-accent\/10 {
  background-color: hsl(var(--accent) / 0.1);
}
.bg-accent\/15 {
  background-color: hsl(var(--accent) / 0.15);
}
.bg-accent\/20 {
  background-color: hsl(var(--accent) / 0.2);
}
.bg-accent\/5 {
  background-color: hsl(var(--accent) / 0.05);
}
.bg-background {
  background-color: hsl(var(--background));
}
.bg-background\/15 {
  background-color: hsl(var(--background) / 0.15);
}
.bg-background\/60 {
  background-color: hsl(var(--background) / 0.6);
}
.bg-background\/80 {
  background-color: hsl(var(--background) / 0.8);
}
.bg-background\/95 {
  background-color: hsl(var(--background) / 0.95);
}
.bg-black\/40 {
  background-color: rgb(0 0 0 / 0.4);
}
.bg-black\/80 {
  background-color: rgb(0 0 0 / 0.8);
}
.bg-blue-500\/10 {
  background-color: rgb(59 130 246 / 0.1);
}
.bg-border {
  background-color: hsl(var(--border));
}
.bg-card {
  background-color: hsl(var(--card));
}
.bg-card\/95 {
  background-color: hsl(var(--card) / 0.95);
}
.bg-destructive {
  background-color: hsl(var(--destructive));
}
.bg-destructive\/10 {
  background-color: hsl(var(--destructive) / 0.1);
}
.bg-destructive\/15 {
  background-color: hsl(var(--destructive) / 0.15);
}
.bg-destructive\/5 {
  background-color: hsl(var(--destructive) / 0.05);
}
.bg-foreground {
  background-color: hsl(var(--foreground));
}
.bg-foreground\/10 {
  background-color: hsl(var(--foreground) / 0.1);
}
.bg-foreground\/90 {
  background-color: hsl(var(--foreground) / 0.9);
}
.bg-green-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(34 197 94 / var(--tw-bg-opacity, 1));
}
.bg-green-500\/10 {
  background-color: rgb(34 197 94 / 0.1);
}
.bg-info\/10 {
  background-color: hsl(var(--info) / 0.1);
}
.bg-muted {
  background-color: hsl(var(--muted));
}
.bg-muted\/20 {
  background-color: hsl(var(--muted) / 0.2);
}
.bg-muted\/30 {
  background-color: hsl(var(--muted) / 0.3);
}
.bg-muted\/40 {
  background-color: hsl(var(--muted) / 0.4);
}
.bg-muted\/50 {
  background-color: hsl(var(--muted) / 0.5);
}
.bg-popover {
  background-color: hsl(var(--popover));
}
.bg-primary {
  background-color: hsl(var(--primary));
}
.bg-primary\/10 {
  background-color: hsl(var(--primary) / 0.1);
}
.bg-primary\/15 {
  background-color: hsl(var(--primary) / 0.15);
}
.bg-primary\/5 {
  background-color: hsl(var(--primary) / 0.05);
}
.bg-secondary {
  background-color: hsl(var(--secondary));
}
.bg-secondary\/40 {
  background-color: hsl(var(--secondary) / 0.4);
}
.bg-sidebar {
  background-color: hsl(var(--sidebar-background));
}
.bg-sidebar-accent\/5 {
  background-color: hsl(var(--sidebar-accent) / 0.05);
}
.bg-sidebar-border {
  background-color: hsl(var(--sidebar-border));
}
.bg-transparent {
  background-color: transparent;
}
.bg-warning\/10 {
  background-color: hsl(var(--warning) / 0.1);
}
.bg-warning\/20 {
  background-color: hsl(var(--warning) / 0.2);
}
.bg-warning\/30 {
  background-color: hsl(var(--warning) / 0.3);
}
.bg-white\/20 {
  background-color: rgb(255 255 255 / 0.2);
}
.bg-\[radial-gradient\(circle_at_top_right\2c hsl\(var\(--accent\)\/0\.25\)\2c transparent_60\%\)\] {
  background-image: radial-gradient(circle at top right,hsl(var(--accent)/0.25),transparent 60%);
}
.bg-gradient-to-b {
  background-image: linear-gradient(to bottom, var(--tw-gradient-stops));
}
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}
.from-\[hsl\(220\2c 30\%\2c 22\%\)\] {
  --tw-gradient-from: hsl(220,30%,22%) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(220 30% 22% / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.from-foreground\/90 {
  --tw-gradient-from: hsl(var(--foreground) / 0.9) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(var(--foreground) / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.from-primary {
  --tw-gradient-from: hsl(var(--primary)) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(var(--primary) / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.via-\[hsl\(220\2c 30\%\2c 18\%\)\] {
  --tw-gradient-to: hsl(220 30% 18% / 0)  var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), hsl(220,30%,18%) var(--tw-gradient-via-position), var(--tw-gradient-to);
}
.via-foreground\/70 {
  --tw-gradient-to: hsl(var(--foreground) / 0)  var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), hsl(var(--foreground) / 0.7) var(--tw-gradient-via-position), var(--tw-gradient-to);
}
.to-\[hsl\(158\2c 40\%\2c 22\%\)\] {
  --tw-gradient-to: hsl(158,40%,22%) var(--tw-gradient-to-position);
}
.to-accent {
  --tw-gradient-to: hsl(var(--accent)) var(--tw-gradient-to-position);
}
.to-foreground\/20 {
  --tw-gradient-to: hsl(var(--foreground) / 0.2) var(--tw-gradient-to-position);
}
.fill-accent {
  fill: hsl(var(--accent));
}
.fill-current {
  fill: currentColor;
}
.fill-yellow-400 {
  fill: #facc15;
}
.stroke-accent {
  stroke: hsl(var(--accent));
}
.stroke-destructive {
  stroke: hsl(var(--destructive));
}
.stroke-muted {
  stroke: hsl(var(--muted));
}
.stroke-primary {
  stroke: hsl(var(--primary));
}
.object-contain {
  -o-object-fit: contain;
     object-fit: contain;
}
.object-cover {
  -o-object-fit: cover;
     object-fit: cover;
}
.p-0 {
  padding: 0px;
}
.p-0\.5 {
  padding: 0.125rem;
}
.p-1 {
  padding: 0.25rem;
}
.p-2 {
  padding: 0.5rem;
}
.p-3 {
  padding: 0.75rem;
}
.p-3\.5 {
  padding: 0.875rem;
}
.p-4 {
  padding: 1rem;
}
.p-5 {
  padding: 1.25rem;
}
.p-6 {
  padding: 1.5rem;
}
.p-7 {
  padding: 1.75rem;
}
.p-8 {
  padding: 2rem;
}
.p-\[1px\] {
  padding: 1px;
}
.px-1 {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
.px-1\.5 {
  padding-left: 0.375rem;
  padding-right: 0.375rem;
}
.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.px-2\.5 {
  padding-left: 0.625rem;
  padding-right: 0.625rem;
}
.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.px-5 {
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}
.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.px-8 {
  padding-left: 2rem;
  padding-right: 2rem;
}
.py-0\.5 {
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
}
.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
.py-1\.5 {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
.py-10 {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}
.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.py-2\.5 {
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
}
.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.py-6 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}
.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
.pb-2 {
  padding-bottom: 0.5rem;
}
.pb-20 {
  padding-bottom: 5rem;
}
.pb-24 {
  padding-bottom: 6rem;
}
.pb-3 {
  padding-bottom: 0.75rem;
}
.pb-4 {
  padding-bottom: 1rem;
}
.pb-6 {
  padding-bottom: 1.5rem;
}
.pl-10 {
  padding-left: 2.5rem;
}
.pl-2 {
  padding-left: 0.5rem;
}
.pl-2\.5 {
  padding-left: 0.625rem;
}
.pl-4 {
  padding-left: 1rem;
}
.pl-8 {
  padding-left: 2rem;
}
.pl-9 {
  padding-left: 2.25rem;
}
.pr-1 {
  padding-right: 0.25rem;
}
.pr-12 {
  padding-right: 3rem;
}
.pr-2 {
  padding-right: 0.5rem;
}
.pr-2\.5 {
  padding-right: 0.625rem;
}
.pr-4 {
  padding-right: 1rem;
}
.pr-8 {
  padding-right: 2rem;
}
.pt-0 {
  padding-top: 0px;
}
.pt-1 {
  padding-top: 0.25rem;
}
.pt-2 {
  padding-top: 0.5rem;
}
.pt-3 {
  padding-top: 0.75rem;
}
.pt-4 {
  padding-top: 1rem;
}
.pt-5 {
  padding-top: 1.25rem;
}
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.align-middle {
  vertical-align: middle;
}
.font-body {
  font-family: Geist, sans-serif;
}
.font-heading {
  font-family: "Be Vietnam Pro", sans-serif;
}
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.\!text-\[13px\] {
  font-size: 13px !important;
}
.\!text-\[14px\] {
  font-size: 14px !important;
}
.\!text-\[16px\] {
  font-size: 16px !important;
}
.\!text-\[18px\] {
  font-size: 18px !important;
}
.\!text-\[20px\] {
  font-size: 20px !important;
}
.\!text-\[22px\] {
  font-size: 22px !important;
}
.\!text-\[28px\] {
  font-size: 28px !important;
}
.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}
.text-4xl {
  font-size: 2.25rem;
  line-height: 2.5rem;
}
.text-5xl {
  font-size: 3rem;
  line-height: 1;
}
.text-\[0\.8rem\] {
  font-size: 0.8rem;
}
.text-\[10px\] {
  font-size: 10px;
}
.text-\[11px\] {
  font-size: 11px;
}
.text-\[180px\] {
  font-size: 180px;
}
.text-\[9px\] {
  font-size: 9px;
}
.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}
.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}
.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}
.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}
.font-black {
  font-weight: 900;
}
.font-bold {
  font-weight: 700;
}
.font-extrabold {
  font-weight: 800;
}
.font-medium {
  font-weight: 500;
}
.font-normal {
  font-weight: 400;
}
.font-semibold {
  font-weight: 600;
}
.uppercase {
  text-transform: uppercase;
}
.italic {
  font-style: italic;
}
.tabular-nums {
  --tw-numeric-spacing: tabular-nums;
  font-variant-numeric: var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction);
}
.leading-\[1\.05\] {
  line-height: 1.05;
}
.leading-none {
  line-height: 1;
}
.leading-relaxed {
  line-height: 1.625;
}
.leading-snug {
  line-height: 1.375;
}
.leading-tight {
  line-height: 1.25;
}
.tracking-\[0\.18em\] {
  letter-spacing: 0.18em;
}
.tracking-tight {
  letter-spacing: -0.025em;
}
.tracking-tighter {
  letter-spacing: -0.05em;
}
.tracking-wide {
  letter-spacing: 0.025em;
}
.tracking-wider {
  letter-spacing: 0.05em;
}
.tracking-widest {
  letter-spacing: 0.1em;
}
.text-accent {
  color: hsl(var(--accent));
}
.text-accent-foreground {
  color: hsl(var(--accent-foreground));
}
.text-accent\/40 {
  color: hsl(var(--accent) / 0.4);
}
.text-background {
  color: hsl(var(--background));
}
.text-background\/40 {
  color: hsl(var(--background) / 0.4);
}
.text-background\/65 {
  color: hsl(var(--background) / 0.65);
}
.text-background\/70 {
  color: hsl(var(--background) / 0.7);
}
.text-background\/75 {
  color: hsl(var(--background) / 0.75);
}
.text-blue-600 {
  --tw-text-opacity: 1;
  color: rgb(37 99 235 / var(--tw-text-opacity, 1));
}
.text-card-foreground {
  color: hsl(var(--card-foreground));
}
.text-current {
  color: currentColor;
}
.text-destructive {
  color: hsl(var(--destructive));
}
.text-destructive-foreground {
  color: hsl(var(--destructive-foreground));
}
.text-foreground {
  color: hsl(var(--foreground));
}
.text-foreground\/15 {
  color: hsl(var(--foreground) / 0.15);
}
.text-foreground\/50 {
  color: hsl(var(--foreground) / 0.5);
}
.text-foreground\/70 {
  color: hsl(var(--foreground) / 0.7);
}
.text-foreground\/80 {
  color: hsl(var(--foreground) / 0.8);
}
.text-foreground\/90 {
  color: hsl(var(--foreground) / 0.9);
}
.text-green-300 {
  --tw-text-opacity: 1;
  color: rgb(134 239 172 / var(--tw-text-opacity, 1));
}
.text-green-700 {
  --tw-text-opacity: 1;
  color: rgb(21 128 61 / var(--tw-text-opacity, 1));
}
.text-info {
  color: hsl(var(--info));
}
.text-muted-foreground {
  color: hsl(var(--muted-foreground));
}
.text-popover-foreground {
  color: hsl(var(--popover-foreground));
}
.text-primary {
  color: hsl(var(--primary));
}
.text-primary-foreground {
  color: hsl(var(--primary-foreground));
}
.text-primary\/70 {
  color: hsl(var(--primary) / 0.7);
}
.text-secondary-foreground {
  color: hsl(var(--secondary-foreground));
}
.text-sidebar-foreground {
  color: hsl(var(--sidebar-foreground));
}
.text-sidebar-foreground\/50 {
  color: hsl(var(--sidebar-foreground) / 0.5);
}
.text-sidebar-foreground\/60 {
  color: hsl(var(--sidebar-foreground) / 0.6);
}
.text-sidebar-foreground\/70 {
  color: hsl(var(--sidebar-foreground) / 0.7);
}
.text-sidebar-foreground\/80 {
  color: hsl(var(--sidebar-foreground) / 0.8);
}
.text-sidebar-primary {
  color: hsl(var(--sidebar-primary));
}
.text-warning {
  color: hsl(var(--warning));
}
.text-warning-foreground {
  color: hsl(var(--warning-foreground));
}
.text-white {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}
.text-white\/70 {
  color: rgb(255 255 255 / 0.7);
}
.text-white\/80 {
  color: rgb(255 255 255 / 0.8);
}
.text-white\/90 {
  color: rgb(255 255 255 / 0.9);
}
.text-yellow-400 {
  --tw-text-opacity: 1;
  color: rgb(250 204 21 / var(--tw-text-opacity, 1));
}
.text-yellow-700 {
  --tw-text-opacity: 1;
  color: rgb(161 98 7 / var(--tw-text-opacity, 1));
}
.underline {
  text-decoration-line: underline;
}
.line-through {
  text-decoration-line: line-through;
}
.underline-offset-4 {
  text-underline-offset: 4px;
}
.accent-primary {
  accent-color: hsl(var(--primary));
}
.opacity-0 {
  opacity: 0;
}
.opacity-10 {
  opacity: 0.1;
}
.opacity-15 {
  opacity: 0.15;
}
.opacity-25 {
  opacity: 0.25;
}
.opacity-50 {
  opacity: 0.5;
}
.opacity-60 {
  opacity: 0.6;
}
.opacity-70 {
  opacity: 0.7;
}
.opacity-75 {
  opacity: 0.75;
}
.opacity-80 {
  opacity: 0.8;
}
.opacity-90 {
  opacity: 0.9;
}
.shadow {
  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-2xl {
  --tw-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --tw-shadow-colored: 0 25px 50px -12px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-\[0_0_0_1px_hsl\(var\(--sidebar-border\)\)\] {
  --tw-shadow: 0 0 0 1px hsl(var(--sidebar-border));
  --tw-shadow-colored: 0 0 0 1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-md {
  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-none {
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-sm {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-xl {
  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-primary\/10 {
  --tw-shadow-color: hsl(var(--primary) / 0.1);
  --tw-shadow: var(--tw-shadow-colored);
}
.shadow-primary\/20 {
  --tw-shadow-color: hsl(var(--primary) / 0.2);
  --tw-shadow: var(--tw-shadow-colored);
}
.outline-none {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.outline {
  outline-style: solid;
}
.ring {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-0 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-2 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-4 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-accent\/50 {
  --tw-ring-color: hsl(var(--accent) / 0.5);
}
.ring-foreground\/30 {
  --tw-ring-color: hsl(var(--foreground) / 0.3);
}
.ring-green-500\/30 {
  --tw-ring-color: rgb(34 197 94 / 0.3);
}
.ring-primary\/40 {
  --tw-ring-color: hsl(var(--primary) / 0.4);
}
.ring-ring {
  --tw-ring-color: hsl(var(--ring));
}
.ring-sidebar-ring {
  --tw-ring-color: hsl(var(--sidebar-ring));
}
.ring-offset-1 {
  --tw-ring-offset-width: 1px;
}
.ring-offset-2 {
  --tw-ring-offset-width: 2px;
}
.ring-offset-background {
  --tw-ring-offset-color: hsl(var(--background));
}
.blur-lg {
  --tw-blur: blur(16px);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.drop-shadow-md {
  --tw-drop-shadow: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.filter {
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.backdrop-blur {
  --tw-backdrop-blur: blur(8px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.backdrop-blur-md {
  --tw-backdrop-blur: blur(12px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.backdrop-blur-sm {
  --tw-backdrop-blur: blur(4px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.backdrop-blur-xl {
  --tw-backdrop-blur: blur(24px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[left\2c right\2c width\] {
  transition-property: left,right,width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[margin\2c opa\] {
  transition-property: margin,opa;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[width\2c height\2c padding\] {
  transition-property: width,height,padding;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[width\] {
  transition-property: width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.duration-1000 {
  transition-duration: 1000ms;
}
.duration-200 {
  transition-duration: 200ms;
}
.duration-300 {
  transition-duration: 300ms;
}
.duration-500 {
  transition-duration: 500ms;
}
.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.ease-linear {
  transition-timing-function: linear;
}
@keyframes enter {

  from {
    opacity: var(--tw-enter-opacity, 1);
    transform: translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0));
  }
}
@keyframes exit {

  to {
    opacity: var(--tw-exit-opacity, 1);
    transform: translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0));
  }
}
.animate-in {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.fade-in {
  --tw-enter-opacity: 0;
}
.fade-in-0 {
  --tw-enter-opacity: 0;
}
.fade-in-80 {
  --tw-enter-opacity: 0.8;
}
.zoom-in-95 {
  --tw-enter-scale: .95;
}
.duration-1000 {
  animation-duration: 1000ms;
}
.duration-200 {
  animation-duration: 200ms;
}
.duration-300 {
  animation-duration: 300ms;
}
.duration-500 {
  animation-duration: 500ms;
}
.ease-in-out {
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.ease-linear {
  animation-timing-function: linear;
}
.running {
  animation-play-state: running;
}
/* 3D flip support */
.perspective-1000 {
    perspective: 1000px;
  }
.transform-style-3d {
    transform-style: preserve-3d;
  }
.backface-hidden {
    backface-visibility: hidden;
  }
.rotate-y-180 {
    transform: rotateY(180deg);
  }

/* Fonts loaded via index.html for Be Vietnam Pro + Geist + Material Symbols */

/* ── Keyframes ── */

@keyframes celebrate {
  0%   { transform: scale(1) rotate(0deg); }
  30%  { transform: scale(1.25) rotate(-4deg); }
  60%  { transform: scale(1.1) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.celebrate {
  animation: celebrate 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-up-fade {
  animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-6px); }
  30%       { transform: translateX(6px); }
  45%       { transform: translateX(-4px); }
  60%       { transform: translateX(4px); }
  75%       { transform: translateX(-2px); }
  90%       { transform: translateX(2px); }
}
.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes spin-slow {
  to { transform: rotate(360deg); }
}
.spin-slow {
  animation: spin-slow 0.9s linear infinite;
}
.file\:border-0::file-selector-button {
  border-width: 0px;
}
.file\:bg-transparent::file-selector-button {
  background-color: transparent;
}
.file\:text-sm::file-selector-button {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.file\:font-medium::file-selector-button {
  font-weight: 500;
}
.file\:text-foreground::file-selector-button {
  color: hsl(var(--foreground));
}
.placeholder\:text-muted-foreground::-moz-placeholder {
  color: hsl(var(--muted-foreground));
}
.placeholder\:text-muted-foreground::placeholder {
  color: hsl(var(--muted-foreground));
}
.after\:absolute::after {
  content: var(--tw-content);
  position: absolute;
}
.after\:-inset-2::after {
  content: var(--tw-content);
  inset: -0.5rem;
}
.after\:inset-y-0::after {
  content: var(--tw-content);
  top: 0px;
  bottom: 0px;
}
.after\:left-1\/2::after {
  content: var(--tw-content);
  left: 50%;
}
.after\:w-1::after {
  content: var(--tw-content);
  width: 0.25rem;
}
.after\:w-\[2px\]::after {
  content: var(--tw-content);
  width: 2px;
}
.after\:-translate-x-1\/2::after {
  content: var(--tw-content);
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.first\:rounded-l-md:first-child {
  border-top-left-radius: calc(var(--radius) - 2px);
  border-bottom-left-radius: calc(var(--radius) - 2px);
}
.first\:border-l:first-child {
  border-left-width: 1px;
}
.last\:rounded-r-md:last-child {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.focus-within\:relative:focus-within {
  position: relative;
}
.focus-within\:z-20:focus-within {
  z-index: 20;
}
.hover\:-translate-y-1:hover {
  --tw-translate-y: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.hover\:border-foreground\/30:hover {
  border-color: hsl(var(--foreground) / 0.3);
}
.hover\:border-primary:hover {
  border-color: hsl(var(--primary));
}
.hover\:border-primary\/30:hover {
  border-color: hsl(var(--primary) / 0.3);
}
.hover\:border-primary\/50:hover {
  border-color: hsl(var(--primary) / 0.5);
}
.hover\:border-primary\/80:hover {
  border-color: hsl(var(--primary) / 0.8);
}
.hover\:bg-accent:hover {
  background-color: hsl(var(--accent));
}
.hover\:bg-accent\/50:hover {
  background-color: hsl(var(--accent) / 0.5);
}
.hover\:bg-accent\/90:hover {
  background-color: hsl(var(--accent) / 0.9);
}
.hover\:bg-background:hover {
  background-color: hsl(var(--background));
}
.hover\:bg-destructive\/10:hover {
  background-color: hsl(var(--destructive) / 0.1);
}
.hover\:bg-destructive\/80:hover {
  background-color: hsl(var(--destructive) / 0.8);
}
.hover\:bg-muted:hover {
  background-color: hsl(var(--muted));
}
.hover\:bg-muted\/30:hover {
  background-color: hsl(var(--muted) / 0.3);
}
.hover\:bg-muted\/50:hover {
  background-color: hsl(var(--muted) / 0.5);
}
.hover\:bg-muted\/80:hover {
  background-color: hsl(var(--muted) / 0.8);
}
.hover\:bg-primary:hover {
  background-color: hsl(var(--primary));
}
.hover\:bg-primary\/10:hover {
  background-color: hsl(var(--primary) / 0.1);
}
.hover\:bg-primary\/20:hover {
  background-color: hsl(var(--primary) / 0.2);
}
.hover\:bg-primary\/80:hover {
  background-color: hsl(var(--primary) / 0.8);
}
.hover\:bg-primary\/95:hover {
  background-color: hsl(var(--primary) / 0.95);
}
.hover\:bg-secondary:hover {
  background-color: hsl(var(--secondary));
}
.hover\:bg-secondary\/80:hover {
  background-color: hsl(var(--secondary) / 0.8);
}
.hover\:bg-sidebar-accent:hover {
  background-color: hsl(var(--sidebar-accent));
}
.hover\:bg-sidebar-accent\/10:hover {
  background-color: hsl(var(--sidebar-accent) / 0.1);
}
.hover\:bg-warning\/15:hover {
  background-color: hsl(var(--warning) / 0.15);
}
.hover\:bg-white\/30:hover {
  background-color: rgb(255 255 255 / 0.3);
}
.hover\:text-accent-foreground:hover {
  color: hsl(var(--accent-foreground));
}
.hover\:text-destructive:hover {
  color: hsl(var(--destructive));
}
.hover\:text-foreground:hover {
  color: hsl(var(--foreground));
}
.hover\:text-muted-foreground:hover {
  color: hsl(var(--muted-foreground));
}
.hover\:text-primary-foreground:hover {
  color: hsl(var(--primary-foreground));
}
.hover\:text-primary\/90:hover {
  color: hsl(var(--primary) / 0.9);
}
.hover\:text-sidebar-accent-foreground:hover {
  color: hsl(var(--sidebar-accent-foreground));
}
.hover\:text-sidebar-foreground:hover {
  color: hsl(var(--sidebar-foreground));
}
.hover\:underline:hover {
  text-decoration-line: underline;
}
.hover\:opacity-100:hover {
  opacity: 1;
}
.hover\:opacity-85:hover {
  opacity: 0.85;
}
.hover\:opacity-90:hover {
  opacity: 0.9;
}
.hover\:opacity-95:hover {
  opacity: 0.95;
}
.hover\:shadow-\[0_0_0_1px_hsl\(var\(--sidebar-accent\)\)\]:hover {
  --tw-shadow: 0 0 0 1px hsl(var(--sidebar-accent));
  --tw-shadow-colored: 0 0 0 1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:shadow-lg:hover {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:shadow-md:hover {
  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:shadow-xl:hover {
  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:brightness-95:hover {
  --tw-brightness: brightness(.95);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.hover\:after\:bg-sidebar-border:hover::after {
  content: var(--tw-content);
  background-color: hsl(var(--sidebar-border));
}
.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
.focus\:fixed:focus {
  position: fixed;
}
.focus\:left-4:focus {
  left: 1rem;
}
.focus\:top-4:focus {
  top: 1rem;
}
.focus\:z-\[9999\]:focus {
  z-index: 9999;
}
.focus\:rounded-lg:focus {
  border-radius: var(--radius);
}
.focus\:bg-accent:focus {
  background-color: hsl(var(--accent));
}
.focus\:bg-primary:focus {
  background-color: hsl(var(--primary));
}
.focus\:px-4:focus {
  padding-left: 1rem;
  padding-right: 1rem;
}
.focus\:py-2:focus {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.focus\:font-semibold:focus {
  font-weight: 600;
}
.focus\:text-accent-foreground:focus {
  color: hsl(var(--accent-foreground));
}
.focus\:text-primary-foreground:focus {
  color: hsl(var(--primary-foreground));
}
.focus\:opacity-100:focus {
  opacity: 1;
}
.focus\:shadow-lg:focus {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.focus\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.focus\:ring-2:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.focus\:ring-primary:focus {
  --tw-ring-color: hsl(var(--primary));
}
.focus\:ring-ring:focus {
  --tw-ring-color: hsl(var(--ring));
}
.focus\:ring-offset-2:focus {
  --tw-ring-offset-width: 2px;
}
.focus-visible\:border-primary:focus-visible {
  border-color: hsl(var(--primary));
}
.focus-visible\:underline:focus-visible {
  text-decoration-line: underline;
}
.focus-visible\:outline-none:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.focus-visible\:ring-1:focus-visible {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.focus-visible\:ring-2:focus-visible {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.focus-visible\:ring-inset:focus-visible {
  --tw-ring-inset: inset;
}
.focus-visible\:ring-destructive:focus-visible {
  --tw-ring-color: hsl(var(--destructive));
}
.focus-visible\:ring-primary:focus-visible {
  --tw-ring-color: hsl(var(--primary));
}
.focus-visible\:ring-ring:focus-visible {
  --tw-ring-color: hsl(var(--ring));
}
.focus-visible\:ring-sidebar-ring:focus-visible {
  --tw-ring-color: hsl(var(--sidebar-ring));
}
.focus-visible\:ring-offset-1:focus-visible {
  --tw-ring-offset-width: 1px;
}
.focus-visible\:ring-offset-2:focus-visible {
  --tw-ring-offset-width: 2px;
}
.focus-visible\:ring-offset-background:focus-visible {
  --tw-ring-offset-color: hsl(var(--background));
}
.active\:scale-95:active {
  --tw-scale-x: .95;
  --tw-scale-y: .95;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\:scale-\[0\.98\]:active {
  --tw-scale-x: 0.98;
  --tw-scale-y: 0.98;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\:scale-\[0\.99\]:active {
  --tw-scale-x: 0.99;
  --tw-scale-y: 0.99;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\:bg-sidebar-accent:active {
  background-color: hsl(var(--sidebar-accent));
}
.active\:text-sidebar-accent-foreground:active {
  color: hsl(var(--sidebar-accent-foreground));
}
.disabled\:pointer-events-none:disabled {
  pointer-events: none;
}
.disabled\:cursor-not-allowed:disabled {
  cursor: not-allowed;
}
.disabled\:opacity-30:disabled {
  opacity: 0.3;
}
.disabled\:opacity-40:disabled {
  opacity: 0.4;
}
.disabled\:opacity-50:disabled {
  opacity: 0.5;
}
.group\/menu-item:focus-within .group-focus-within\/menu-item\:opacity-100 {
  opacity: 1;
}
.group:hover .group-hover\:translate-x-0\.5 {
  --tw-translate-x: 0.125rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group:hover .group-hover\:scale-105 {
  --tw-scale-x: 1.05;
  --tw-scale-y: 1.05;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group:hover .group-hover\:gap-2 {
  gap: 0.5rem;
}
.group:hover .group-hover\:border-foreground\/20 {
  border-color: hsl(var(--foreground) / 0.2);
}
.group:hover .group-hover\:text-primary {
  color: hsl(var(--primary));
}
.group\/menu-item:hover .group-hover\/menu-item\:opacity-100 {
  opacity: 1;
}
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
.group.destructive .group-\[\.destructive\]\:border-muted\/40 {
  border-color: hsl(var(--muted) / 0.4);
}
.group.toaster .group-\[\.toaster\]\:border-border {
  border-color: hsl(var(--border));
}
.group.toast .group-\[\.toast\]\:bg-muted {
  background-color: hsl(var(--muted));
}
.group.toast .group-\[\.toast\]\:bg-primary {
  background-color: hsl(var(--primary));
}
.group.toaster .group-\[\.toaster\]\:bg-background {
  background-color: hsl(var(--background));
}
.group.destructive .group-\[\.destructive\]\:text-red-300 {
  --tw-text-opacity: 1;
  color: rgb(252 165 165 / var(--tw-text-opacity, 1));
}
.group.toast .group-\[\.toast\]\:text-muted-foreground {
  color: hsl(var(--muted-foreground));
}
.group.toast .group-\[\.toast\]\:text-primary-foreground {
  color: hsl(var(--primary-foreground));
}
.group.toaster .group-\[\.toaster\]\:text-foreground {
  color: hsl(var(--foreground));
}
.group.toaster .group-\[\.toaster\]\:shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.group.destructive .group-\[\.destructive\]\:hover\:border-destructive\/30:hover {
  border-color: hsl(var(--destructive) / 0.3);
}
.group.destructive .group-\[\.destructive\]\:hover\:bg-destructive:hover {
  background-color: hsl(var(--destructive));
}
.group.destructive .group-\[\.destructive\]\:hover\:text-destructive-foreground:hover {
  color: hsl(var(--destructive-foreground));
}
.group.destructive .group-\[\.destructive\]\:hover\:text-red-50:hover {
  --tw-text-opacity: 1;
  color: rgb(254 242 242 / var(--tw-text-opacity, 1));
}
.group.destructive .group-\[\.destructive\]\:focus\:ring-destructive:focus {
  --tw-ring-color: hsl(var(--destructive));
}
.group.destructive .group-\[\.destructive\]\:focus\:ring-red-400:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(248 113 113 / var(--tw-ring-opacity, 1));
}
.group.destructive .group-\[\.destructive\]\:focus\:ring-offset-red-600:focus {
  --tw-ring-offset-color: #dc2626;
}
.peer\/menu-button:hover ~ .peer-hover\/menu-button\:text-sidebar-accent-foreground {
  color: hsl(var(--sidebar-accent-foreground));
}
.peer:disabled ~ .peer-disabled\:cursor-not-allowed {
  cursor: not-allowed;
}
.peer:disabled ~ .peer-disabled\:opacity-70 {
  opacity: 0.7;
}
.has-\[\[data-variant\=inset\]\]\:bg-sidebar:has([data-variant=inset]) {
  background-color: hsl(var(--sidebar-background));
}
.has-\[\:disabled\]\:opacity-50:has(:disabled) {
  opacity: 0.5;
}
.group\/menu-item:has([data-sidebar=menu-action]) .group-has-\[\[data-sidebar\=menu-action\]\]\/menu-item\:pr-8 {
  padding-right: 2rem;
}
.aria-disabled\:pointer-events-none[aria-disabled="true"] {
  pointer-events: none;
}
.aria-disabled\:opacity-50[aria-disabled="true"] {
  opacity: 0.5;
}
.aria-selected\:bg-accent[aria-selected="true"] {
  background-color: hsl(var(--accent));
}
.aria-selected\:bg-accent\/50[aria-selected="true"] {
  background-color: hsl(var(--accent) / 0.5);
}
.aria-selected\:text-accent-foreground[aria-selected="true"] {
  color: hsl(var(--accent-foreground));
}
.aria-selected\:text-muted-foreground[aria-selected="true"] {
  color: hsl(var(--muted-foreground));
}
.aria-selected\:opacity-100[aria-selected="true"] {
  opacity: 1;
}
.aria-selected\:opacity-30[aria-selected="true"] {
  opacity: 0.3;
}
.data-\[disabled\=true\]\:pointer-events-none[data-disabled="true"] {
  pointer-events: none;
}
.data-\[disabled\]\:pointer-events-none[data-disabled] {
  pointer-events: none;
}
.data-\[panel-group-direction\=vertical\]\:h-px[data-panel-group-direction="vertical"] {
  height: 1px;
}
.data-\[panel-group-direction\=vertical\]\:w-full[data-panel-group-direction="vertical"] {
  width: 100%;
}
.data-\[side\=bottom\]\:translate-y-1[data-side="bottom"] {
  --tw-translate-y: 0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[side\=left\]\:-translate-x-1[data-side="left"] {
  --tw-translate-x: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[side\=right\]\:translate-x-1[data-side="right"] {
  --tw-translate-x: 0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[side\=top\]\:-translate-y-1[data-side="top"] {
  --tw-translate-y: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[state\=checked\]\:translate-x-5[data-state="checked"] {
  --tw-translate-x: 1.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[state\=unchecked\]\:translate-x-0[data-state="unchecked"] {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[swipe\=cancel\]\:translate-x-0[data-swipe="cancel"] {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[swipe\=end\]\:translate-x-\[var\(--radix-toast-swipe-end-x\)\][data-swipe="end"] {
  --tw-translate-x: var(--radix-toast-swipe-end-x);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[swipe\=move\]\:translate-x-\[var\(--radix-toast-swipe-move-x\)\][data-swipe="move"] {
  --tw-translate-x: var(--radix-toast-swipe-move-x);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
@keyframes accordion-up {

  from {
    height: var(--radix-accordion-content-height);
  }

  to {
    height: 0;
  }
}
.data-\[state\=closed\]\:animate-accordion-up[data-state="closed"] {
  animation: accordion-up 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}
@keyframes accordion-down {

  from {
    height: 0;
  }

  to {
    height: var(--radix-accordion-content-height);
  }
}
.data-\[state\=open\]\:animate-accordion-down[data-state="open"] {
  animation: accordion-down 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}
.data-\[panel-group-direction\=vertical\]\:flex-col[data-panel-group-direction="vertical"] {
  flex-direction: column;
}
.data-\[active\=true\]\:bg-sidebar-accent[data-active="true"] {
  background-color: hsl(var(--sidebar-accent));
}
.data-\[active\]\:bg-accent\/50[data-active] {
  background-color: hsl(var(--accent) / 0.5);
}
.data-\[selected\=\'true\'\]\:bg-accent[data-selected='true'] {
  background-color: hsl(var(--accent));
}
.data-\[state\=active\]\:bg-background[data-state="active"] {
  background-color: hsl(var(--background));
}
.data-\[state\=checked\]\:bg-primary[data-state="checked"] {
  background-color: hsl(var(--primary));
}
.data-\[state\=on\]\:bg-accent[data-state="on"] {
  background-color: hsl(var(--accent));
}
.data-\[state\=open\]\:bg-accent[data-state="open"] {
  background-color: hsl(var(--accent));
}
.data-\[state\=open\]\:bg-accent\/50[data-state="open"] {
  background-color: hsl(var(--accent) / 0.5);
}
.data-\[state\=open\]\:bg-secondary[data-state="open"] {
  background-color: hsl(var(--secondary));
}
.data-\[state\=selected\]\:bg-muted[data-state="selected"] {
  background-color: hsl(var(--muted));
}
.data-\[state\=unchecked\]\:bg-input[data-state="unchecked"] {
  background-color: hsl(var(--input));
}
.data-\[active\=true\]\:font-medium[data-active="true"] {
  font-weight: 500;
}
.data-\[active\=true\]\:text-sidebar-accent-foreground[data-active="true"] {
  color: hsl(var(--sidebar-accent-foreground));
}
.data-\[selected\=true\]\:text-accent-foreground[data-selected="true"] {
  color: hsl(var(--accent-foreground));
}
.data-\[state\=active\]\:text-foreground[data-state="active"] {
  color: hsl(var(--foreground));
}
.data-\[state\=checked\]\:text-primary-foreground[data-state="checked"] {
  color: hsl(var(--primary-foreground));
}
.data-\[state\=on\]\:text-accent-foreground[data-state="on"] {
  color: hsl(var(--accent-foreground));
}
.data-\[state\=open\]\:text-accent-foreground[data-state="open"] {
  color: hsl(var(--accent-foreground));
}
.data-\[state\=open\]\:text-muted-foreground[data-state="open"] {
  color: hsl(var(--muted-foreground));
}
.data-\[disabled\=true\]\:opacity-50[data-disabled="true"] {
  opacity: 0.5;
}
.data-\[disabled\]\:opacity-50[data-disabled] {
  opacity: 0.5;
}
.data-\[state\=open\]\:opacity-100[data-state="open"] {
  opacity: 1;
}
.data-\[state\=active\]\:shadow-sm[data-state="active"] {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.data-\[swipe\=move\]\:transition-none[data-swipe="move"] {
  transition-property: none;
}
.data-\[state\=closed\]\:duration-300[data-state="closed"] {
  transition-duration: 300ms;
}
.data-\[state\=open\]\:duration-500[data-state="open"] {
  transition-duration: 500ms;
}
.data-\[motion\^\=from-\]\:animate-in[data-motion^="from-"] {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.data-\[state\=open\]\:animate-in[data-state="open"] {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.data-\[state\=visible\]\:animate-in[data-state="visible"] {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.data-\[motion\^\=to-\]\:animate-out[data-motion^="to-"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[state\=closed\]\:animate-out[data-state="closed"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[state\=hidden\]\:animate-out[data-state="hidden"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[swipe\=end\]\:animate-out[data-swipe="end"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[motion\^\=from-\]\:fade-in[data-motion^="from-"] {
  --tw-enter-opacity: 0;
}
.data-\[motion\^\=to-\]\:fade-out[data-motion^="to-"] {
  --tw-exit-opacity: 0;
}
.data-\[state\=closed\]\:fade-out-0[data-state="closed"] {
  --tw-exit-opacity: 0;
}
.data-\[state\=closed\]\:fade-out-80[data-state="closed"] {
  --tw-exit-opacity: 0.8;
}
.data-\[state\=hidden\]\:fade-out[data-state="hidden"] {
  --tw-exit-opacity: 0;
}
.data-\[state\=open\]\:fade-in-0[data-state="open"] {
  --tw-enter-opacity: 0;
}
.data-\[state\=visible\]\:fade-in[data-state="visible"] {
  --tw-enter-opacity: 0;
}
.data-\[state\=closed\]\:zoom-out-95[data-state="closed"] {
  --tw-exit-scale: .95;
}
.data-\[state\=open\]\:zoom-in-90[data-state="open"] {
  --tw-enter-scale: .9;
}
.data-\[state\=open\]\:zoom-in-95[data-state="open"] {
  --tw-enter-scale: .95;
}
.data-\[motion\=from-end\]\:slide-in-from-right-52[data-motion="from-end"] {
  --tw-enter-translate-x: 13rem;
}
.data-\[motion\=from-start\]\:slide-in-from-left-52[data-motion="from-start"] {
  --tw-enter-translate-x: -13rem;
}
.data-\[motion\=to-end\]\:slide-out-to-right-52[data-motion="to-end"] {
  --tw-exit-translate-x: 13rem;
}
.data-\[motion\=to-start\]\:slide-out-to-left-52[data-motion="to-start"] {
  --tw-exit-translate-x: -13rem;
}
.data-\[side\=bottom\]\:slide-in-from-top-2[data-side="bottom"] {
  --tw-enter-translate-y: -0.5rem;
}
.data-\[side\=left\]\:slide-in-from-right-2[data-side="left"] {
  --tw-enter-translate-x: 0.5rem;
}
.data-\[side\=right\]\:slide-in-from-left-2[data-side="right"] {
  --tw-enter-translate-x: -0.5rem;
}
.data-\[side\=top\]\:slide-in-from-bottom-2[data-side="top"] {
  --tw-enter-translate-y: 0.5rem;
}
.data-\[state\=closed\]\:slide-out-to-bottom[data-state="closed"] {
  --tw-exit-translate-y: 100%;
}
.data-\[state\=closed\]\:slide-out-to-left[data-state="closed"] {
  --tw-exit-translate-x: -100%;
}
.data-\[state\=closed\]\:slide-out-to-left-1\/2[data-state="closed"] {
  --tw-exit-translate-x: -50%;
}
.data-\[state\=closed\]\:slide-out-to-right[data-state="closed"] {
  --tw-exit-translate-x: 100%;
}
.data-\[state\=closed\]\:slide-out-to-right-full[data-state="closed"] {
  --tw-exit-translate-x: 100%;
}
.data-\[state\=closed\]\:slide-out-to-top[data-state="closed"] {
  --tw-exit-translate-y: -100%;
}
.data-\[state\=closed\]\:slide-out-to-top-\[48\%\][data-state="closed"] {
  --tw-exit-translate-y: -48%;
}
.data-\[state\=open\]\:slide-in-from-bottom[data-state="open"] {
  --tw-enter-translate-y: 100%;
}
.data-\[state\=open\]\:slide-in-from-left[data-state="open"] {
  --tw-enter-translate-x: -100%;
}
.data-\[state\=open\]\:slide-in-from-left-1\/2[data-state="open"] {
  --tw-enter-translate-x: -50%;
}
.data-\[state\=open\]\:slide-in-from-right[data-state="open"] {
  --tw-enter-translate-x: 100%;
}
.data-\[state\=open\]\:slide-in-from-top[data-state="open"] {
  --tw-enter-translate-y: -100%;
}
.data-\[state\=open\]\:slide-in-from-top-\[48\%\][data-state="open"] {
  --tw-enter-translate-y: -48%;
}
.data-\[state\=open\]\:slide-in-from-top-full[data-state="open"] {
  --tw-enter-translate-y: -100%;
}
.data-\[state\=closed\]\:duration-300[data-state="closed"] {
  animation-duration: 300ms;
}
.data-\[state\=open\]\:duration-500[data-state="open"] {
  animation-duration: 500ms;
}
.data-\[panel-group-direction\=vertical\]\:after\:left-0[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  left: 0px;
}
.data-\[panel-group-direction\=vertical\]\:after\:h-1[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  height: 0.25rem;
}
.data-\[panel-group-direction\=vertical\]\:after\:w-full[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  width: 100%;
}
.data-\[panel-group-direction\=vertical\]\:after\:-translate-y-1\/2[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[panel-group-direction\=vertical\]\:after\:translate-x-0[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[state\=open\]\:hover\:bg-sidebar-accent:hover[data-state="open"] {
  background-color: hsl(var(--sidebar-accent));
}
.data-\[state\=open\]\:hover\:text-sidebar-accent-foreground:hover[data-state="open"] {
  color: hsl(var(--sidebar-accent-foreground));
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:left-\[calc\(var\(--sidebar-width\)\*-1\)\] {
  left: calc(var(--sidebar-width) * -1);
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:right-\[calc\(var\(--sidebar-width\)\*-1\)\] {
  right: calc(var(--sidebar-width) * -1);
}
.group[data-side="left"] .group-data-\[side\=left\]\:-right-4 {
  right: -1rem;
}
.group[data-side="right"] .group-data-\[side\=right\]\:left-0 {
  left: 0px;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:-mt-8 {
  margin-top: -2rem;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:hidden {
  display: none;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:\!size-8 {
  width: 2rem !important;
  height: 2rem !important;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:w-\[--sidebar-width-icon\] {
  width: var(--sidebar-width-icon);
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:w-\[calc\(var\(--sidebar-width-icon\)_\+_theme\(spacing\.4\)\)\] {
  width: calc(var(--sidebar-width-icon) + 1rem);
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:w-\[calc\(var\(--sidebar-width-icon\)_\+_theme\(spacing\.4\)_\+2px\)\] {
  width: calc(var(--sidebar-width-icon) + 1rem + 2px);
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:w-0 {
  width: 0px;
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:translate-x-0 {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group[data-side="right"] .group-data-\[side\=right\]\:rotate-180 {
  --tw-rotate: 180deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group[data-state="open"] .group-data-\[state\=open\]\:rotate-180 {
  --tw-rotate: 180deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:overflow-hidden {
  overflow: hidden;
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:rounded-lg {
  border-radius: var(--radius);
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:border {
  border-width: 1px;
}
.group[data-side="left"] .group-data-\[side\=left\]\:border-r {
  border-right-width: 1px;
}
.group[data-side="right"] .group-data-\[side\=right\]\:border-l {
  border-left-width: 1px;
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:border-sidebar-border {
  border-color: hsl(var(--sidebar-border));
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:\!p-0 {
  padding: 0px !important;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:\!p-2 {
  padding: 0.5rem !important;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:opacity-0 {
  opacity: 0;
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:shadow {
  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:after\:left-full::after {
  content: var(--tw-content);
  left: 100%;
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:hover\:bg-sidebar:hover {
  background-color: hsl(var(--sidebar-background));
}
.peer\/menu-button[data-size="default"] ~ .peer-data-\[size\=default\]\/menu-button\:top-1\.5 {
  top: 0.375rem;
}
.peer\/menu-button[data-size="lg"] ~ .peer-data-\[size\=lg\]\/menu-button\:top-2\.5 {
  top: 0.625rem;
}
.peer\/menu-button[data-size="sm"] ~ .peer-data-\[size\=sm\]\/menu-button\:top-1 {
  top: 0.25rem;
}
.peer[data-variant="inset"] ~ .peer-data-\[variant\=inset\]\:min-h-\[calc\(100svh-theme\(spacing\.4\)\)\] {
  min-height: calc(100svh - 1rem);
}
.peer\/menu-button[data-active="true"] ~ .peer-data-\[active\=true\]\/menu-button\:text-sidebar-accent-foreground {
  color: hsl(var(--sidebar-accent-foreground));
}
.dark\:border-destructive:is(.dark *) {
  border-color: hsl(var(--destructive));
}
.dark\:text-green-400:is(.dark *) {
  --tw-text-opacity: 1;
  color: rgb(74 222 128 / var(--tw-text-opacity, 1));
}
@media (min-width: 640px) {

  .sm\:bottom-0 {
    bottom: 0px;
  }

  .sm\:right-0 {
    right: 0px;
  }

  .sm\:top-\[73px\] {
    top: 73px;
  }

  .sm\:top-auto {
    top: auto;
  }

  .sm\:mt-0 {
    margin-top: 0px;
  }

  .sm\:block {
    display: block;
  }

  .sm\:inline-block {
    display: inline-block;
  }

  .sm\:flex {
    display: flex;
  }

  .sm\:h-52 {
    height: 13rem;
  }

  .sm\:w-64 {
    width: 16rem;
  }

  .sm\:w-auto {
    width: auto;
  }

  .sm\:max-w-md {
    max-width: 28rem;
  }

  .sm\:max-w-sm {
    max-width: 24rem;
  }

  .sm\:flex-none {
    flex: none;
  }

  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sm\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sm\:flex-row {
    flex-direction: row;
  }

  .sm\:flex-col {
    flex-direction: column;
  }

  .sm\:items-center {
    align-items: center;
  }

  .sm\:justify-end {
    justify-content: flex-end;
  }

  .sm\:gap-2\.5 {
    gap: 0.625rem;
  }

  .sm\:space-x-2 > :not([hidden]) ~ :not([hidden]) {
    --tw-space-x-reverse: 0;
    margin-right: calc(0.5rem * var(--tw-space-x-reverse));
    margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));
  }

  .sm\:space-x-4 > :not([hidden]) ~ :not([hidden]) {
    --tw-space-x-reverse: 0;
    margin-right: calc(1rem * var(--tw-space-x-reverse));
    margin-left: calc(1rem * calc(1 - var(--tw-space-x-reverse)));
  }

  .sm\:space-y-0 > :not([hidden]) ~ :not([hidden]) {
    --tw-space-y-reverse: 0;
    margin-top: calc(0px * calc(1 - var(--tw-space-y-reverse)));
    margin-bottom: calc(0px * var(--tw-space-y-reverse));
  }

  .sm\:rounded-lg {
    border-radius: var(--radius);
  }

  .sm\:p-8 {
    padding: 2rem;
  }

  .sm\:px-10 {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
  }

  .sm\:text-left {
    text-align: left;
  }

  .sm\:text-4xl {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }

  .data-\[state\=open\]\:sm\:slide-in-from-bottom-full[data-state="open"] {
    --tw-enter-translate-y: 100%;
  }
}
@media (min-width: 768px) {

  .md\:absolute {
    position: absolute;
  }

  .md\:mx-0 {
    margin-left: 0px;
    margin-right: 0px;
  }

  .md\:ml-60 {
    margin-left: 15rem;
  }

  .md\:block {
    display: block;
  }

  .md\:flex {
    display: flex;
  }

  .md\:grid {
    display: grid;
  }

  .md\:hidden {
    display: none;
  }

  .md\:h-44 {
    height: 11rem;
  }

  .md\:w-\[var\(--radix-navigation-menu-viewport-width\)\] {
    width: var(--radix-navigation-menu-viewport-width);
  }

  .md\:w-auto {
    width: auto;
  }

  .md\:min-w-0 {
    min-width: 0px;
  }

  .md\:max-w-\[420px\] {
    max-width: 420px;
  }

  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .md\:p-6 {
    padding: 1.5rem;
  }

  .md\:p-7 {
    padding: 1.75rem;
  }

  .md\:p-8 {
    padding: 2rem;
  }

  .md\:px-0 {
    padding-left: 0px;
    padding-right: 0px;
  }

  .md\:px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .md\:px-7 {
    padding-left: 1.75rem;
    padding-right: 1.75rem;
  }

  .md\:px-8 {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .md\:py-16 {
    padding-top: 4rem;
    padding-bottom: 4rem;
  }

  .md\:pb-0 {
    padding-bottom: 0px;
  }

  .md\:pb-8 {
    padding-bottom: 2rem;
  }

  .md\:text-3xl {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .md\:text-4xl {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }

  .md\:text-5xl {
    font-size: 3rem;
    line-height: 1;
  }

  .md\:text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .md\:text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }

  .md\:opacity-0 {
    opacity: 0;
  }

  .after\:md\:hidden::after {
    content: var(--tw-content);
    display: none;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:m-2 {
    margin: 0.5rem;
  }

  .peer[data-state="collapsed"][data-variant="inset"] ~ .md\:peer-data-\[state\=collapsed\]\:peer-data-\[variant\=inset\]\:ml-2 {
    margin-left: 0.5rem;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:ml-0 {
    margin-left: 0px;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:rounded-xl {
    border-radius: 0.75rem;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:shadow {
    --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }
}
@media (min-width: 1024px) {

  .lg\:col-span-2 {
    grid-column: span 2 / span 2;
  }

  .lg\:block {
    display: block;
  }

  .lg\:flex {
    display: flex;
  }

  .lg\:h-auto {
    height: auto;
  }

  .lg\:min-h-screen {
    min-height: 100vh;
  }

  .lg\:w-\[480px\] {
    width: 480px;
  }

  .lg\:flex-1 {
    flex: 1 1 0%;
  }

  .lg\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .lg\:grid-cols-\[1fr_1\.2fr\] {
    grid-template-columns: 1fr 1.2fr;
  }

  .lg\:grid-cols-\[1fr_320px\] {
    grid-template-columns: 1fr 320px;
  }

  .lg\:flex-row {
    flex-direction: row;
  }

  .lg\:bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
  }

  .lg\:p-12 {
    padding: 3rem;
  }

  .lg\:px-12 {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  .lg\:py-10 {
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
  }
}
@media (min-width: 1280px) {

  .xl\:w-\[520px\] {
    width: 520px;
  }

  .xl\:text-6xl {
    font-size: 3.75rem;
    line-height: 1;
  }
}
.\[\&\:has\(\[aria-selected\]\)\]\:bg-accent:has([aria-selected]) {
  background-color: hsl(var(--accent));
}
.first\:\[\&\:has\(\[aria-selected\]\)\]\:rounded-l-md:has([aria-selected]):first-child {
  border-top-left-radius: calc(var(--radius) - 2px);
  border-bottom-left-radius: calc(var(--radius) - 2px);
}
.last\:\[\&\:has\(\[aria-selected\]\)\]\:rounded-r-md:has([aria-selected]):last-child {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.\[\&\:has\(\[aria-selected\]\.day-outside\)\]\:bg-accent\/50:has([aria-selected].day-outside) {
  background-color: hsl(var(--accent) / 0.5);
}
.\[\&\:has\(\[aria-selected\]\.day-range-end\)\]\:rounded-r-md:has([aria-selected].day-range-end) {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.\[\&\:has\(\[role\=checkbox\]\)\]\:pr-0:has([role=checkbox]) {
  padding-right: 0px;
}
.\[\&\>button\]\:hidden>button {
  display: none;
}
.\[\&\>span\:last-child\]\:truncate>span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.\[\&\>span\]\:line-clamp-1>span {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}
.\[\&\>svg\+div\]\:translate-y-\[-3px\]>svg+div {
  --tw-translate-y: -3px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.\[\&\>svg\]\:absolute>svg {
  position: absolute;
}
.\[\&\>svg\]\:left-4>svg {
  left: 1rem;
}
.\[\&\>svg\]\:top-4>svg {
  top: 1rem;
}
.\[\&\>svg\]\:size-3\.5>svg {
  width: 0.875rem;
  height: 0.875rem;
}
.\[\&\>svg\]\:size-4>svg {
  width: 1rem;
  height: 1rem;
}
.\[\&\>svg\]\:h-2\.5>svg {
  height: 0.625rem;
}
.\[\&\>svg\]\:h-3>svg {
  height: 0.75rem;
}
.\[\&\>svg\]\:w-2\.5>svg {
  width: 0.625rem;
}
.\[\&\>svg\]\:w-3>svg {
  width: 0.75rem;
}
.\[\&\>svg\]\:shrink-0>svg {
  flex-shrink: 0;
}
.\[\&\>svg\]\:text-destructive>svg {
  color: hsl(var(--destructive));
}
.\[\&\>svg\]\:text-foreground>svg {
  color: hsl(var(--foreground));
}
.\[\&\>svg\]\:text-muted-foreground>svg {
  color: hsl(var(--muted-foreground));
}
.\[\&\>svg\]\:text-sidebar-accent-foreground>svg {
  color: hsl(var(--sidebar-accent-foreground));
}
.\[\&\>svg\~\*\]\:pl-7>svg~* {
  padding-left: 1.75rem;
}
.\[\&\>tr\]\:last\:border-b-0:last-child>tr {
  border-bottom-width: 0px;
}
.\[\&\[data-panel-group-direction\=vertical\]\>div\]\:rotate-90[data-panel-group-direction=vertical]>div {
  --tw-rotate: 90deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.\[\&\[data-state\=open\]\>svg\]\:rotate-180[data-state=open]>svg {
  --tw-rotate: 180deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.\[\&_\.recharts-cartesian-axis-tick_text\]\:fill-muted-foreground .recharts-cartesian-axis-tick text {
  fill: hsl(var(--muted-foreground));
}
.\[\&_\.recharts-cartesian-grid_line\[stroke\=\'\#ccc\'\]\]\:stroke-border\/50 .recharts-cartesian-grid line[stroke='#ccc'] {
  stroke: hsl(var(--border) / 0.5);
}
.\[\&_\.recharts-curve\.recharts-tooltip-cursor\]\:stroke-border .recharts-curve.recharts-tooltip-cursor {
  stroke: hsl(var(--border));
}
.\[\&_\.recharts-dot\[stroke\=\'\#fff\'\]\]\:stroke-transparent .recharts-dot[stroke='#fff'] {
  stroke: transparent;
}
.\[\&_\.recharts-layer\]\:outline-none .recharts-layer {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.\[\&_\.recharts-polar-grid_\[stroke\=\'\#ccc\'\]\]\:stroke-border .recharts-polar-grid [stroke='#ccc'] {
  stroke: hsl(var(--border));
}
.\[\&_\.recharts-radial-bar-background-sector\]\:fill-muted .recharts-radial-bar-background-sector {
  fill: hsl(var(--muted));
}
.\[\&_\.recharts-rectangle\.recharts-tooltip-cursor\]\:fill-muted .recharts-rectangle.recharts-tooltip-cursor {
  fill: hsl(var(--muted));
}
.\[\&_\.recharts-reference-line_\[stroke\=\'\#ccc\'\]\]\:stroke-border .recharts-reference-line [stroke='#ccc'] {
  stroke: hsl(var(--border));
}
.\[\&_\.recharts-sector\[stroke\=\'\#fff\'\]\]\:stroke-transparent .recharts-sector[stroke='#fff'] {
  stroke: transparent;
}
.\[\&_\.recharts-sector\]\:outline-none .recharts-sector {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.\[\&_\.recharts-surface\]\:outline-none .recharts-surface {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.\[\&_\[cmdk-group-heading\]\]\:px-2 [cmdk-group-heading] {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.\[\&_\[cmdk-group-heading\]\]\:py-1\.5 [cmdk-group-heading] {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
.\[\&_\[cmdk-group-heading\]\]\:text-xs [cmdk-group-heading] {
  font-size: 0.75rem;
  line-height: 1rem;
}
.\[\&_\[cmdk-group-heading\]\]\:font-medium [cmdk-group-heading] {
  font-weight: 500;
}
.\[\&_\[cmdk-group-heading\]\]\:text-muted-foreground [cmdk-group-heading] {
  color: hsl(var(--muted-foreground));
}
.\[\&_\[cmdk-group\]\:not\(\[hidden\]\)_\~\[cmdk-group\]\]\:pt-0 [cmdk-group]:not([hidden]) ~[cmdk-group] {
  padding-top: 0px;
}
.\[\&_\[cmdk-group\]\]\:px-2 [cmdk-group] {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.\[\&_\[cmdk-input-wrapper\]_svg\]\:h-5 [cmdk-input-wrapper] svg {
  height: 1.25rem;
}
.\[\&_\[cmdk-input-wrapper\]_svg\]\:w-5 [cmdk-input-wrapper] svg {
  width: 1.25rem;
}
.\[\&_\[cmdk-input\]\]\:h-12 [cmdk-input] {
  height: 3rem;
}
.\[\&_\[cmdk-item\]\]\:px-2 [cmdk-item] {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.\[\&_\[cmdk-item\]\]\:py-3 [cmdk-item] {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.\[\&_\[cmdk-item\]_svg\]\:h-5 [cmdk-item] svg {
  height: 1.25rem;
}
.\[\&_\[cmdk-item\]_svg\]\:w-5 [cmdk-item] svg {
  width: 1.25rem;
}
.\[\&_p\]\:leading-relaxed p {
  line-height: 1.625;
}
.\[\&_svg\]\:pointer-events-none svg {
  pointer-events: none;
}
.\[\&_svg\]\:size-4 svg {
  width: 1rem;
  height: 1rem;
}
.\[\&_svg\]\:shrink-0 svg {
  flex-shrink: 0;
}
.\[\&_tr\:last-child\]\:border-0 tr:last-child {
  border-width: 0px;
}
.\[\&_tr\]\:border-b tr {
  border-bottom-width: 1px;
}
[data-side=left][data-collapsible=offcanvas] .\[\[data-side\=left\]\[data-collapsible\=offcanvas\]_\&\]\:-right-2 {
  right: -0.5rem;
}
[data-side=left][data-state=collapsed] .\[\[data-side\=left\]\[data-state\=collapsed\]_\&\]\:cursor-e-resize {
  cursor: e-resize;
}
[data-side=left] .\[\[data-side\=left\]_\&\]\:cursor-w-resize {
  cursor: w-resize;
}
[data-side=right][data-collapsible=offcanvas] .\[\[data-side\=right\]\[data-collapsible\=offcanvas\]_\&\]\:-left-2 {
  left: -0.5rem;
}
[data-side=right][data-state=collapsed] .\[\[data-side\=right\]\[data-state\=collapsed\]_\&\]\:cursor-w-resize {
  cursor: w-resize;
}
[data-side=right] .\[\[data-side\=right\]_\&\]\:cursor-e-resize {
  cursor: e-resize;
}
</style></head>

  <body>
    <div id="root"><section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text" aria-atomic="false"></section><div class="min-h-screen flex bg-background"><a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-semibold focus:shadow-lg">Skip to main content</a><aside aria-label="Main navigation" class="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30"><div class="p-5 shrink-0"><div class="flex items-center gap-2.5"><div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-4 h-4 text-primary-foreground" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></div><span class="font-heading font-bold text-sidebar-foreground text-sm tracking-tight">DriveMy</span></div></div><nav aria-label="Primary" class="flex-1 px-3 space-y-1 overflow-y-auto"><a aria-label="Home" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard w-5 h-5 shrink-0" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg><span class="text-sm leading-tight">Home</span></a><a aria-label="Learn" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/theory"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open w-5 h-5 shrink-0" aria-hidden="true"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg><span class="text-sm leading-tight">Learn</span></a><a aria-label="Practice" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 bg-sidebar-accent/5 text-sidebar-primary font-semibold" href="/quizzes" aria-current="page"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target w-5 h-5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg><span class="text-sm leading-tight">Practice</span></a><a aria-label="Simulations" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/simulations"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-5 h-5 shrink-0" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg><span class="text-sm leading-tight">Simulations</span></a><a aria-label="Progress" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/progress"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column w-5 h-5 shrink-0" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg><span class="text-sm leading-tight">Progress</span></a></nav><div class="px-4 py-2 flex items-center gap-2 border-t border-sidebar-border"><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>EN</button><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs" aria-label="Theme: Light"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg> Light</button></div><div class="p-4 border-t border-sidebar-border"><div class="flex items-center gap-3 mb-3" aria-label="Signed in as Local Developer"><div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0" aria-hidden="true">L</div><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-sidebar-foreground truncate">Local Developer</p><p class="text-xs text-sidebar-foreground/50 truncate">dev@drivemaster.local</p></div></div><button class="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 h-9 rounded-md px-3 w-full justify-start text-sidebar-foreground/60 hover:text-destructive min-h-[48px]" aria-label="Sign out of your account"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out w-4 h-4 mr-2" aria-hidden="true"><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path></svg>Sign Out</button></div></aside><div class="flex-1 flex flex-col min-w-0 md:ml-60"><header role="banner" class="md:hidden flex items-center justify-between px-4 border-b bg-card sticky top-0 z-40" style="height: 56px;"><a class="flex items-center gap-2 rounded-md" aria-label="DriveMy — go to Home" href="/"><div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-4 h-4 text-primary-foreground" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></div><span class="font-heading font-bold text-sm">DriveMy</span></a><div class="flex items-center gap-1"><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs" aria-label="Theme: Light"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg> Light</button><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>EN</button><div class="relative ml-1"><button aria-label="Profile for Local Developer — toggle menu" aria-expanded="false" aria-haspopup="menu" class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">L</button></div></div></header><main id="main-content" class="flex-1 overflow-auto pb-20 md:pb-0" tabindex="-1" aria-label="Page content"><div class="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in"><div class="rounded-3xl overflow-hidden border bg-card shadow-xl"><div class="relative h-36 md:h-44 bg-gradient-to-br from-[hsl(220,30%,22%)] via-[hsl(220,30%,18%)] to-[hsl(158,40%,22%)] overflow-hidden"><div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.25),transparent_60%)]"></div><div class="absolute -bottom-10 -right-6 opacity-10"><span class="material-symbols-outlined select-none text-[180px] text-white" aria-hidden="true">quiz</span></div><div class="relative h-full flex flex-col justify-end p-5 md:p-7 text-white"><span class="text-[10px] tracking-[0.18em] font-semibold uppercase text-white/80">KPP Quiz Master</span><h1 class="font-heading font-extrabold text-2xl md:text-3xl leading-tight mt-1">Configure your session for the perfect practice</h1><p class="text-sm text-white/80 italic mt-0.5">Konfigurasi sesi anda untuk latihan sempurna</p></div></div><div class="p-5 md:p-7 space-y-5"><p class="text-sm text-muted-foreground leading-relaxed">10 randomized questions from 50+ question bank. Covers traffic rules, road signs, safety &amp; manual driving.</p><div><div class="text-[10px] tracking-[0.18em] font-bold uppercase text-muted-foreground mb-2">Select KPP Section</div><div class="grid gap-2.5 grid-cols-3"><button class="relative rounded-2xl border-2 p-3 text-left transition-all hover:border-foreground/30 border-border bg-muted/20"><div class="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Section</div><div class="font-heading font-black text-3xl leading-none mt-1">A</div><div class="mt-2"><div class="text-sm font-semibold leading-tight">Section A</div><div class="text-[11px] text-muted-foreground mt-0.5">General Theory</div></div></button><button class="relative rounded-2xl border-2 p-3 text-left transition-all hover:border-foreground/30 border-border bg-muted/20"><div class="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Section</div><div class="font-heading font-black text-3xl leading-none mt-1">B</div><div class="mt-2"><div class="text-sm font-semibold leading-tight">Section B</div><div class="text-[11px] text-muted-foreground mt-0.5">Traffic Signs</div></div></button><button class="relative rounded-2xl border-2 p-3 text-left transition-all hover:border-foreground/30 border-border bg-muted/20"><div class="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Section</div><div class="font-heading font-black text-3xl leading-none mt-1">C</div><div class="mt-2"><div class="text-sm font-semibold leading-tight">Section C</div><div class="text-[11px] text-muted-foreground mt-0.5">Road Codes</div></div></button></div></div><button class="w-full rounded-2xl py-4 px-5 flex items-center justify-center gap-2 font-heading font-bold text-base text-primary-foreground transition-all hover:opacity-95 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed bg-accent shadow-md"><span class="material-symbols-outlined select-none text-xl" aria-hidden="true">bolt</span>Master the Road</button><div class="text-xs text-muted-foreground text-center">Both English &amp; Bahasa Melayu shown — KPP test is in Malay.<br><span class="italic">The first driving license in Malaysia was issued in 1958.</span></div></div></div></div></main><footer class="hidden md:block border-t p-4 text-center text-xs text-muted-foreground">Final Year Project – INFO 4401 (Semester 2 2025/2026) by Ahmad Faiz &amp; Ahmad Adam Danial</footer></div><nav aria-label="Mobile navigation" class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex items-stretch pb-safe" style="min-height: 64px;"><a aria-label="Home" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard w-5 h-5 transition-transform" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Home</span></a><a aria-label="Learn" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/theory"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open w-5 h-5 transition-transform" aria-hidden="true"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Learn</span></a><a aria-label="Practice" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-primary" href="/quizzes" aria-current="page"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all bg-primary/10 scale-105" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target w-5 h-5 transition-transform scale-110" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-primary">Practice</span></a><a aria-label="Simulations" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/simulations"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-5 h-5 transition-transform" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Simulations</span></a><a aria-label="Progress" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/progress"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column w-5 h-5 transition-transform" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Progress</span></a></nav></div></div>
    <script type="module" src="/src/main.tsx"></script>
  

</body></html>

Then the actual content should start after that. Like this:
<html lang="en" class="light"><head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- TODO: Set the document title to the name of your application -->
    <title>DriveMy – Malaysian Driving Test Prep</title>
    <meta name="description" content="Interactive web-based driving learning app with realistic JPJ practical exam simulations for Malaysian learners.">
    <meta name="author" content="Ahmad Faiz &amp; Ahmad Adam Danial">

    <meta property="og:title" content="DriveMy – Malaysian Driving Test Prep">
    <meta property="og:description" content="Master your JPJ practical exam with interactive simulations and theory learning.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="/og-image.png">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="/og-image.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&amp;family=Geist:wght@300;400;500;600;700;800;900&amp;family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&amp;display=swap" rel="stylesheet">
    <style>
      .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
    </style>
  <style type="text/css">:where(html[dir="ltr"]),:where([data-sonner-toaster][dir="ltr"]){--toast-icon-margin-start: -3px;--toast-icon-margin-end: 4px;--toast-svg-margin-start: -1px;--toast-svg-margin-end: 0px;--toast-button-margin-start: auto;--toast-button-margin-end: 0;--toast-close-button-start: 0;--toast-close-button-end: unset;--toast-close-button-transform: translate(-35%, -35%)}:where(html[dir="rtl"]),:where([data-sonner-toaster][dir="rtl"]){--toast-icon-margin-start: 4px;--toast-icon-margin-end: -3px;--toast-svg-margin-start: 0px;--toast-svg-margin-end: -1px;--toast-button-margin-start: 0;--toast-button-margin-end: auto;--toast-close-button-start: unset;--toast-close-button-end: 0;--toast-close-button-transform: translate(35%, -35%)}:where([data-sonner-toaster]){position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1: hsl(0, 0%, 99%);--gray2: hsl(0, 0%, 97.3%);--gray3: hsl(0, 0%, 95.1%);--gray4: hsl(0, 0%, 93%);--gray5: hsl(0, 0%, 90.9%);--gray6: hsl(0, 0%, 88.7%);--gray7: hsl(0, 0%, 85.8%);--gray8: hsl(0, 0%, 78%);--gray9: hsl(0, 0%, 56.1%);--gray10: hsl(0, 0%, 52.3%);--gray11: hsl(0, 0%, 43.5%);--gray12: hsl(0, 0%, 9%);--border-radius: 8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:none;z-index:999999999;transition:transform .4s ease}:where([data-sonner-toaster][data-lifted="true"]){transform:translateY(-10px)}@media (hover: none) and (pointer: coarse){:where([data-sonner-toaster][data-lifted="true"]){transform:none}}:where([data-sonner-toaster][data-x-position="right"]){right:var(--offset-right)}:where([data-sonner-toaster][data-x-position="left"]){left:var(--offset-left)}:where([data-sonner-toaster][data-x-position="center"]){left:50%;transform:translate(-50%)}:where([data-sonner-toaster][data-y-position="top"]){top:var(--offset-top)}:where([data-sonner-toaster][data-y-position="bottom"]){bottom:var(--offset-bottom)}:where([data-sonner-toast]){--y: translateY(100%);--lift-amount: calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);filter:blur(0);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:none;overflow-wrap:anywhere}:where([data-sonner-toast][data-styled="true"]){padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px #0000001a;width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}:where([data-sonner-toast]:focus-visible){box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast][data-y-position="top"]){top:0;--y: translateY(-100%);--lift: 1;--lift-amount: calc(1 * var(--gap))}:where([data-sonner-toast][data-y-position="bottom"]){bottom:0;--y: translateY(100%);--lift: -1;--lift-amount: calc(var(--lift) * var(--gap))}:where([data-sonner-toast]) :where([data-description]){font-weight:400;line-height:1.4;color:inherit}:where([data-sonner-toast]) :where([data-title]){font-weight:500;line-height:1.5;color:inherit}:where([data-sonner-toast]) :where([data-icon]){display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}:where([data-sonner-toast][data-promise="true"]) :where([data-icon])>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}:where([data-sonner-toast]) :where([data-icon])>*{flex-shrink:0}:where([data-sonner-toast]) :where([data-icon]) svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}:where([data-sonner-toast]) :where([data-content]){display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;cursor:pointer;outline:none;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}:where([data-sonner-toast]) :where([data-button]):focus-visible{box-shadow:0 0 0 2px #0006}:where([data-sonner-toast]) :where([data-button]):first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}:where([data-sonner-toast]) :where([data-cancel]){color:var(--normal-text);background:rgba(0,0,0,.08)}:where([data-sonner-toast][data-theme="dark"]) :where([data-cancel]){background:rgba(255,255,255,.3)}:where([data-sonner-toast]) :where([data-close-button]){position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast] [data-close-button]{background:var(--gray1)}:where([data-sonner-toast]) :where([data-close-button]):focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast]) :where([data-disabled="true"]){cursor:not-allowed}:where([data-sonner-toast]):hover :where([data-close-button]):hover{background:var(--gray2);border-color:var(--gray5)}:where([data-sonner-toast][data-swiping="true"]):before{content:"";position:absolute;left:-50%;right:-50%;height:100%;z-index:-1}:where([data-sonner-toast][data-y-position="top"][data-swiping="true"]):before{bottom:50%;transform:scaleY(3) translateY(50%)}:where([data-sonner-toast][data-y-position="bottom"][data-swiping="true"]):before{top:50%;transform:scaleY(3) translateY(-50%)}:where([data-sonner-toast][data-swiping="false"][data-removed="true"]):before{content:"";position:absolute;inset:0;transform:scaleY(2)}:where([data-sonner-toast]):after{content:"";position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}:where([data-sonner-toast][data-mounted="true"]){--y: translateY(0);opacity:1}:where([data-sonner-toast][data-expanded="false"][data-front="false"]){--scale: var(--toasts-before) * .05 + 1;--y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}:where([data-sonner-toast])>*{transition:opacity .4s}:where([data-sonner-toast][data-expanded="false"][data-front="false"][data-styled="true"])>*{opacity:0}:where([data-sonner-toast][data-visible="false"]){opacity:0;pointer-events:none}:where([data-sonner-toast][data-mounted="true"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}:where([data-sonner-toast][data-removed="true"][data-front="true"][data-swipe-out="false"]){--y: translateY(calc(var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="false"]){--y: translateY(40%);opacity:0;transition:transform .5s,opacity .2s}:where([data-sonner-toast][data-removed="true"][data-front="false"]):before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y, 0px)) translate(var(--swipe-amount-x, 0px));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width: 600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-theme=light]{--normal-bg: #fff;--normal-border: var(--gray4);--normal-text: var(--gray12);--success-bg: hsl(143, 85%, 96%);--success-border: hsl(145, 92%, 91%);--success-text: hsl(140, 100%, 27%);--info-bg: hsl(208, 100%, 97%);--info-border: hsl(221, 91%, 91%);--info-text: hsl(210, 92%, 45%);--warning-bg: hsl(49, 100%, 97%);--warning-border: hsl(49, 91%, 91%);--warning-text: hsl(31, 92%, 45%);--error-bg: hsl(359, 100%, 97%);--error-border: hsl(359, 100%, 94%);--error-text: hsl(360, 100%, 45%)}[data-sonner-toaster][data-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg: #000;--normal-border: hsl(0, 0%, 20%);--normal-text: var(--gray1)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg: #fff;--normal-border: var(--gray3);--normal-text: var(--gray12)}[data-sonner-toaster][data-theme=dark]{--normal-bg: #000;--normal-bg-hover: hsl(0, 0%, 12%);--normal-border: hsl(0, 0%, 20%);--normal-border-hover: hsl(0, 0%, 25%);--normal-text: var(--gray1);--success-bg: hsl(150, 100%, 6%);--success-border: hsl(147, 100%, 12%);--success-text: hsl(150, 86%, 65%);--info-bg: hsl(215, 100%, 6%);--info-border: hsl(223, 100%, 12%);--info-text: hsl(216, 87%, 65%);--warning-bg: hsl(64, 100%, 6%);--warning-border: hsl(60, 100%, 12%);--warning-text: hsl(46, 87%, 65%);--error-bg: hsl(358, 76%, 10%);--error-border: hsl(357, 89%, 16%);--error-text: hsl(358, 100%, 81%)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success],[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info],[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning],[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error],[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size: 16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:nth-child(1){animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}to{opacity:.15}}@media (prefers-reduced-motion){[data-sonner-toast],[data-sonner-toast]>*,.sonner-loading-bar{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}
</style><style type="text/css" data-vite-dev-id="C:/Users/ASUS/Documents/2026/SEM 2/FYP/Version Controls/Ver 5/jpj-drivemaster-main/jpj-drivemaster-main/src/index.css">*, ::before, ::after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}/*
! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com
*//*
1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
*/

*,
::before,
::after {
  box-sizing: border-box; /* 1 */
  border-width: 0; /* 2 */
  border-style: solid; /* 2 */
  border-color: #e5e7eb; /* 2 */
}

::before,
::after {
  --tw-content: '';
}

/*
1. Use a consistent sensible line-height in all browsers.
2. Prevent adjustments of font size after orientation changes in iOS.
3. Use a more readable tab size.
4. Use the user's configured `sans` font-family by default.
5. Use the user's configured `sans` font-feature-settings by default.
6. Use the user's configured `sans` font-variation-settings by default.
7. Disable tap highlights on iOS
*/

html,
:host {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  -moz-tab-size: 4; /* 3 */
  -o-tab-size: 4;
     tab-size: 4; /* 3 */
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 4 */
  font-feature-settings: normal; /* 5 */
  font-variation-settings: normal; /* 6 */
  -webkit-tap-highlight-color: transparent; /* 7 */
}

/*
1. Remove the margin in all browsers.
2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.
*/

body {
  margin: 0; /* 1 */
  line-height: inherit; /* 2 */
}

/*
1. Add the correct height in Firefox.
2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
3. Ensure horizontal rules are visible by default.
*/

hr {
  height: 0; /* 1 */
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
}

/*
Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
}

/*
Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  text-decoration: inherit;
}

/*
Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
1. Use the user's configured `mono` font-family by default.
2. Use the user's configured `mono` font-feature-settings by default.
3. Use the user's configured `mono` font-variation-settings by default.
4. Correct the odd `em` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* 1 */
  font-feature-settings: normal; /* 2 */
  font-variation-settings: normal; /* 3 */
  font-size: 1em; /* 4 */
}

/*
Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
Prevent `sub` and `sup` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
  border-collapse: collapse; /* 3 */
}

/*
1. Change the font styles in all browsers.
2. Remove the margin in Firefox and Safari.
3. Remove default padding in all browsers.
*/

button,
input,
optgroup,
select,
textarea {
  font-family: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  font-size: 100%; /* 1 */
  font-weight: inherit; /* 1 */
  line-height: inherit; /* 1 */
  letter-spacing: inherit; /* 1 */
  color: inherit; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 3 */
}

/*
Remove the inheritance of text transform in Edge and Firefox.
*/

button,
select {
  text-transform: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Remove default button styles.
*/

button,
input:where([type='button']),
input:where([type='reset']),
input:where([type='submit']) {
  -webkit-appearance: button; /* 1 */
  background-color: transparent; /* 2 */
  background-image: none; /* 2 */
}

/*
Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
Remove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
1. Correct the odd appearance in Chrome and Safari.
2. Correct the outline style in Safari.
*/

[type='search'] {
  -webkit-appearance: textfield; /* 1 */
  outline-offset: -2px; /* 2 */
}

/*
Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Change font properties to `inherit` in Safari.
*/

::-webkit-file-upload-button {
  -webkit-appearance: button; /* 1 */
  font: inherit; /* 2 */
}

/*
Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
Removes the default spacing and border for appropriate elements.
*/

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

/*
Reset default styling for dialogs.
*/
dialog {
  padding: 0;
}

/*
Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
2. Set the default placeholder color to the user's configured gray 400 color.
*/

input::-moz-placeholder, textarea::-moz-placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

input::placeholder,
textarea::placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

/*
Set the default cursor for buttons.
*/

button,
[role="button"] {
  cursor: pointer;
}

/*
Make sure disabled buttons don't get the pointer cursor.
*/
:disabled {
  cursor: default;
}

/*
1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)
2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
   This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}

/*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/* Make elements with the HTML hidden attribute stay hidden by default */
[hidden]:where(:not([hidden="until-found"])) {
  display: none;
}
  :root {
    /* Warm Bone / Off-White background, high contrast charcoal text */
    --background: 40 20% 98%;      /* #FBFBFA */
    --foreground: 0 0% 7%;         /* #111111 */

    --card: 0 0% 100%;             /* #FFFFFF */
    --card-foreground: 0 0% 7%;

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 7%;

    --primary: 0 0% 7%;            /* Charcoal Black for primary */
    --primary-foreground: 0 0% 100%;

    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 7%;

    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 47%;  /* #787774 */

    --accent: 140 20% 96%;         /* Pale Green for subtle accent #EDF3EC */
    --accent-foreground: 120 32% 30%; /* Text #346538 */

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 92%;            /* #EAEAEA */
    --input: 0 0% 92%;
    --ring: 0 0% 7%;               /* Charcoal ring */

    --radius: 0.5rem;              /* Crisp 8px radius */

    --sidebar-background: 40 20% 98%; /* Match background */
    --sidebar-foreground: 0 0% 30%;
    --sidebar-primary: 0 0% 7%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 0 0% 0%;     /* We'll use opacity for accents */
    --sidebar-accent-foreground: 0 0% 7%;
    --sidebar-border: 0 0% 92%;
    --sidebar-ring: 0 0% 7%;

    --success: 120 32% 30%;
    --warning: 38 92% 44%;
    --warning-foreground: 0 0% 9%;
    --info: 210 90% 50%;

    --font-heading: '"Be Vietnam Pro"', sans-serif;
    --font-body: 'Geist', sans-serif;
  }

  .dark {
    /* Pure black OLED feel */
    --background: 0 0% 0%;
    --foreground: 0 0% 96%;
    
    --card: 0 0% 4%;
    --card-foreground: 0 0% 96%;
    
    --popover: 0 0% 4%;
    --popover-foreground: 0 0% 96%;
    
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 4%;
    
    --secondary: 0 0% 10%;
    --secondary-foreground: 0 0% 96%;
    
    --muted: 0 0% 12%;
    --muted-foreground: 0 0% 60%;
    
    --accent: 120 15% 15%;
    --accent-foreground: 120 30% 70%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    
    --border: 0 0% 12%;
    --input: 0 0% 15%;
    --ring: 0 0% 98%;
    
    --sidebar-background: 0 0% 0%;
    --sidebar-foreground: 0 0% 70%;
    --sidebar-primary: 0 0% 98%;
    --sidebar-primary-foreground: 0 0% 4%;
    --sidebar-accent: 0 0% 100%;
    --sidebar-accent-foreground: 0 0% 98%;
    --sidebar-border: 0 0% 12%;
    --sidebar-ring: 0 0% 98%;
    
    --warning: 38 92% 54%;
    --warning-foreground: 0 0% 9%;
  }
  * {
  border-color: hsl(var(--border));
}
  body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  /* ── Global focus ring ── */
  :focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
    border-radius: 0.375rem;
  }
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* ── Tactile button feedback ── */
  button:active:not(:disabled),
  a[role="button"]:active:not(:disabled),
  .btn:active:not(:disabled) {
    transform: scale(0.97);
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  /* Respect reduced-motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
.container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: 2rem;
  padding-left: 2rem;
}
@media (min-width: 1400px) {

  .container {
    max-width: 1400px;
  }
}
/* ── Shared card surface ── */
.glass-card {
  border-radius: 0.75rem;
  border-width: 1px;
  border-color: hsl(var(--border));
  background-color: hsl(var(--card));
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
/* Safe-area bottom padding for notched phones */
.pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
/* Nav item base — 48dp minimum touch target */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
    min-height: 48px;
    min-width: 48px;
}
/* ── Loading skeleton ── */
@keyframes pulse {

  50% {
    opacity: .5;
  }
}
.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: var(--radius);
  background-color: hsl(var(--muted));
}
/* ── Page section header ── */
.section-title {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.05em;
}
/* ── Stat value display ── */
.stat-value {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  --tw-numeric-spacing: tabular-nums;
  font-variant-numeric: var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction);
  line-height: 1;
}
/* ── Caption / small label ── */
.caption {
  font-size: 0.75rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
}
/* ── Eyebrow label ── */
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: hsl(var(--muted-foreground));
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.pointer-events-none {
  pointer-events: none;
}
.pointer-events-auto {
  pointer-events: auto;
}
.visible {
  visibility: visible;
}
.invisible {
  visibility: hidden;
}
.fixed {
  position: fixed;
}
.absolute {
  position: absolute;
}
.relative {
  position: relative;
}
.sticky {
  position: sticky;
}
.-inset-1 {
  inset: -0.25rem;
}
.inset-0 {
  inset: 0px;
}
.inset-x-0 {
  left: 0px;
  right: 0px;
}
.inset-y-0 {
  top: 0px;
  bottom: 0px;
}
.-bottom-10 {
  bottom: -2.5rem;
}
.-bottom-12 {
  bottom: -3rem;
}
.-left-12 {
  left: -3rem;
}
.-right-12 {
  right: -3rem;
}
.-right-6 {
  right: -1.5rem;
}
.-top-12 {
  top: -3rem;
}
.bottom-0 {
  bottom: 0px;
}
.left-0 {
  left: 0px;
}
.left-1 {
  left: 0.25rem;
}
.left-1\/2 {
  left: 50%;
}
.left-2 {
  left: 0.5rem;
}
.left-2\.5 {
  left: 0.625rem;
}
.left-3 {
  left: 0.75rem;
}
.left-3\.5 {
  left: 0.875rem;
}
.left-\[50\%\] {
  left: 50%;
}
.right-0 {
  right: 0px;
}
.right-1 {
  right: 0.25rem;
}
.right-2 {
  right: 0.5rem;
}
.right-3 {
  right: 0.75rem;
}
.right-4 {
  right: 1rem;
}
.top-0 {
  top: 0px;
}
.top-1\.5 {
  top: 0.375rem;
}
.top-1\/2 {
  top: 50%;
}
.top-12 {
  top: 3rem;
}
.top-2 {
  top: 0.5rem;
}
.top-3 {
  top: 0.75rem;
}
.top-3\.5 {
  top: 0.875rem;
}
.top-4 {
  top: 1rem;
}
.top-\[1px\] {
  top: 1px;
}
.top-\[50\%\] {
  top: 50%;
}
.top-\[60\%\] {
  top: 60%;
}
.top-\[73px\] {
  top: 73px;
}
.top-full {
  top: 100%;
}
.z-10 {
  z-index: 10;
}
.z-20 {
  z-index: 20;
}
.z-30 {
  z-index: 30;
}
.z-40 {
  z-index: 40;
}
.z-50 {
  z-index: 50;
}
.z-\[100\] {
  z-index: 100;
}
.z-\[1\] {
  z-index: 1;
}
.-mx-1 {
  margin-left: -0.25rem;
  margin-right: -0.25rem;
}
.-mx-4 {
  margin-left: -1rem;
  margin-right: -1rem;
}
.mx-2 {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
.mx-3\.5 {
  margin-left: 0.875rem;
  margin-right: 0.875rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-0\.5 {
  margin-top: 0.125rem;
  margin-bottom: 0.125rem;
}
.my-1 {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
.my-3 {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}
.-ml-4 {
  margin-left: -1rem;
}
.-mt-4 {
  margin-top: -1rem;
}
.mb-0\.5 {
  margin-bottom: 0.125rem;
}
.mb-1 {
  margin-bottom: 0.25rem;
}
.mb-1\.5 {
  margin-bottom: 0.375rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.mb-5 {
  margin-bottom: 1.25rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.mb-8 {
  margin-bottom: 2rem;
}
.ml-1 {
  margin-left: 0.25rem;
}
.ml-auto {
  margin-left: auto;
}
.mr-1 {
  margin-right: 0.25rem;
}
.mr-2 {
  margin-right: 0.5rem;
}
.mt-0\.5 {
  margin-top: 0.125rem;
}
.mt-1 {
  margin-top: 0.25rem;
}
.mt-1\.5 {
  margin-top: 0.375rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-24 {
  margin-top: 6rem;
}
.mt-3 {
  margin-top: 0.75rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mt-5 {
  margin-top: 1.25rem;
}
.mt-6 {
  margin-top: 1.5rem;
}
.mt-8 {
  margin-top: 2rem;
}
.mt-auto {
  margin-top: auto;
}
.block {
  display: block;
}
.inline-block {
  display: inline-block;
}
.flex {
  display: flex;
}
.inline-flex {
  display: inline-flex;
}
.table {
  display: table;
}
.grid {
  display: grid;
}
.hidden {
  display: none;
}
.aspect-square {
  aspect-ratio: 1 / 1;
}
.aspect-video {
  aspect-ratio: 16 / 9;
}
.size-4 {
  width: 1rem;
  height: 1rem;
}
.h-1 {
  height: 0.25rem;
}
.h-1\.5 {
  height: 0.375rem;
}
.h-10 {
  height: 2.5rem;
}
.h-11 {
  height: 2.75rem;
}
.h-12 {
  height: 3rem;
}
.h-14 {
  height: 3.5rem;
}
.h-16 {
  height: 4rem;
}
.h-2 {
  height: 0.5rem;
}
.h-2\.5 {
  height: 0.625rem;
}
.h-24 {
  height: 6rem;
}
.h-28 {
  height: 7rem;
}
.h-3 {
  height: 0.75rem;
}
.h-3\.5 {
  height: 0.875rem;
}
.h-36 {
  height: 9rem;
}
.h-4 {
  height: 1rem;
}
.h-40 {
  height: 10rem;
}
.h-44 {
  height: 11rem;
}
.h-48 {
  height: 12rem;
}
.h-5 {
  height: 1.25rem;
}
.h-6 {
  height: 1.5rem;
}
.h-64 {
  height: 16rem;
}
.h-7 {
  height: 1.75rem;
}
.h-8 {
  height: 2rem;
}
.h-9 {
  height: 2.25rem;
}
.h-\[1px\] {
  height: 1px;
}
.h-\[280px\] {
  height: 280px;
}
.h-\[var\(--radix-navigation-menu-viewport-height\)\] {
  height: var(--radix-navigation-menu-viewport-height);
}
.h-\[var\(--radix-select-trigger-height\)\] {
  height: var(--radix-select-trigger-height);
}
.h-auto {
  height: auto;
}
.h-full {
  height: 100%;
}
.h-px {
  height: 1px;
}
.h-svh {
  height: 100svh;
}
.max-h-72 {
  max-height: 18rem;
}
.max-h-96 {
  max-height: 24rem;
}
.max-h-\[120px\] {
  max-height: 120px;
}
.max-h-\[300px\] {
  max-height: 300px;
}
.max-h-screen {
  max-height: 100vh;
}
.min-h-0 {
  min-height: 0px;
}
.min-h-\[48px\] {
  min-height: 48px;
}
.min-h-\[56px\] {
  min-height: 56px;
}
.min-h-\[80px\] {
  min-height: 80px;
}
.min-h-\[calc\(100vh-4rem\)\] {
  min-height: calc(100vh - 4rem);
}
.min-h-screen {
  min-height: 100vh;
}
.min-h-svh {
  min-height: 100svh;
}
.w-0 {
  width: 0px;
}
.w-1 {
  width: 0.25rem;
}
.w-10 {
  width: 2.5rem;
}
.w-11 {
  width: 2.75rem;
}
.w-12 {
  width: 3rem;
}
.w-14 {
  width: 3.5rem;
}
.w-16 {
  width: 4rem;
}
.w-2 {
  width: 0.5rem;
}
.w-2\.5 {
  width: 0.625rem;
}
.w-24 {
  width: 6rem;
}
.w-28 {
  width: 7rem;
}
.w-3 {
  width: 0.75rem;
}
.w-3\.5 {
  width: 0.875rem;
}
.w-3\/4 {
  width: 75%;
}
.w-4 {
  width: 1rem;
}
.w-44 {
  width: 11rem;
}
.w-5 {
  width: 1.25rem;
}
.w-52 {
  width: 13rem;
}
.w-6 {
  width: 1.5rem;
}
.w-60 {
  width: 15rem;
}
.w-64 {
  width: 16rem;
}
.w-7 {
  width: 1.75rem;
}
.w-72 {
  width: 18rem;
}
.w-8 {
  width: 2rem;
}
.w-9 {
  width: 2.25rem;
}
.w-\[--sidebar-width\] {
  width: var(--sidebar-width);
}
.w-\[100px\] {
  width: 100px;
}
.w-\[1px\] {
  width: 1px;
}
.w-\[70vw\] {
  width: 70vw;
}
.w-auto {
  width: auto;
}
.w-full {
  width: 100%;
}
.w-max {
  width: -moz-max-content;
  width: max-content;
}
.w-px {
  width: 1px;
}
.min-w-0 {
  min-width: 0px;
}
.min-w-5 {
  min-width: 1.25rem;
}
.min-w-\[12rem\] {
  min-width: 12rem;
}
.min-w-\[240px\] {
  min-width: 240px;
}
.min-w-\[8rem\] {
  min-width: 8rem;
}
.min-w-\[var\(--radix-select-trigger-width\)\] {
  min-width: var(--radix-select-trigger-width);
}
.max-w-2xl {
  max-width: 42rem;
}
.max-w-3xl {
  max-width: 48rem;
}
.max-w-4xl {
  max-width: 56rem;
}
.max-w-5xl {
  max-width: 64rem;
}
.max-w-6xl {
  max-width: 72rem;
}
.max-w-7xl {
  max-width: 80rem;
}
.max-w-\[--skeleton-width\] {
  max-width: var(--skeleton-width);
}
.max-w-\[120px\] {
  max-width: 120px;
}
.max-w-\[240px\] {
  max-width: 240px;
}
.max-w-lg {
  max-width: 32rem;
}
.max-w-max {
  max-width: -moz-max-content;
  max-width: max-content;
}
.max-w-md {
  max-width: 28rem;
}
.max-w-sm {
  max-width: 24rem;
}
.max-w-xs {
  max-width: 20rem;
}
.flex-1 {
  flex: 1 1 0%;
}
.flex-shrink-0 {
  flex-shrink: 0;
}
.shrink-0 {
  flex-shrink: 0;
}
.grow {
  flex-grow: 1;
}
.grow-0 {
  flex-grow: 0;
}
.basis-full {
  flex-basis: 100%;
}
.caption-bottom {
  caption-side: bottom;
}
.border-collapse {
  border-collapse: collapse;
}
.-translate-x-1\/2 {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-x-px {
  --tw-translate-x: -1px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-y-1\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-x-\[-50\%\] {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-x-px {
  --tw-translate-x: 1px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-\[-50\%\] {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-rotate-90 {
  --tw-rotate: -90deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.rotate-45 {
  --tw-rotate: 45deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.rotate-90 {
  --tw-rotate: 90deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.scale-105 {
  --tw-scale-x: 1.05;
  --tw-scale-y: 1.05;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.scale-110 {
  --tw-scale-x: 1.1;
  --tw-scale-y: 1.1;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
@keyframes fade-in {

  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes ping {

  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes pulse {

  50% {
    opacity: .5;
  }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes slide-up-fade {

  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-up-fade {
  animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes spin {

  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.cursor-default {
  cursor: default;
}
.cursor-pointer {
  cursor: pointer;
}
.touch-none {
  touch-action: none;
}
.select-none {
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.snap-x {
  scroll-snap-type: x var(--tw-scroll-snap-strictness);
}
.snap-mandatory {
  --tw-scroll-snap-strictness: mandatory;
}
.snap-center {
  scroll-snap-align: center;
}
.list-disc {
  list-style-type: disc;
}
.list-none {
  list-style-type: none;
}
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.flex-row {
  flex-direction: row;
}
.flex-col {
  flex-direction: column;
}
.flex-col-reverse {
  flex-direction: column-reverse;
}
.flex-wrap {
  flex-wrap: wrap;
}
.flex-nowrap {
  flex-wrap: nowrap;
}
.place-items-center {
  place-items: center;
}
.items-start {
  align-items: flex-start;
}
.items-end {
  align-items: flex-end;
}
.items-center {
  align-items: center;
}
.items-baseline {
  align-items: baseline;
}
.items-stretch {
  align-items: stretch;
}
.justify-start {
  justify-content: flex-start;
}
.justify-end {
  justify-content: flex-end;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.gap-1 {
  gap: 0.25rem;
}
.gap-1\.5 {
  gap: 0.375rem;
}
.gap-2 {
  gap: 0.5rem;
}
.gap-2\.5 {
  gap: 0.625rem;
}
.gap-3 {
  gap: 0.75rem;
}
.gap-4 {
  gap: 1rem;
}
.gap-5 {
  gap: 1.25rem;
}
.gap-6 {
  gap: 1.5rem;
}
.gap-8 {
  gap: 2rem;
}
.space-x-1 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(0.25rem * var(--tw-space-x-reverse));
  margin-left: calc(0.25rem * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-4 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(1rem * var(--tw-space-x-reverse));
  margin-left: calc(1rem * calc(1 - var(--tw-space-x-reverse)));
}
.space-y-1 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.25rem * var(--tw-space-y-reverse));
}
.space-y-1\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.375rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.375rem * var(--tw-space-y-reverse));
}
.space-y-10 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(2.5rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(2.5rem * var(--tw-space-y-reverse));
}
.space-y-2 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.5rem * var(--tw-space-y-reverse));
}
.space-y-2\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.625rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.625rem * var(--tw-space-y-reverse));
}
.space-y-3 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.75rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.75rem * var(--tw-space-y-reverse));
}
.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1rem * var(--tw-space-y-reverse));
}
.space-y-5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1.25rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1.25rem * var(--tw-space-y-reverse));
}
.space-y-6 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1.5rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1.5rem * var(--tw-space-y-reverse));
}
.overflow-auto {
  overflow: auto;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-x-auto {
  overflow-x: auto;
}
.overflow-y-auto {
  overflow-y: auto;
}
.overflow-x-hidden {
  overflow-x: hidden;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.whitespace-nowrap {
  white-space: nowrap;
}
.break-words {
  overflow-wrap: break-word;
}
.rounded {
  border-radius: 0.25rem;
}
.rounded-2xl {
  border-radius: 1rem;
}
.rounded-3xl {
  border-radius: 1.5rem;
}
.rounded-\[2px\] {
  border-radius: 2px;
}
.rounded-\[inherit\] {
  border-radius: inherit;
}
.rounded-full {
  border-radius: 9999px;
}
.rounded-lg {
  border-radius: var(--radius);
}
.rounded-md {
  border-radius: calc(var(--radius) - 2px);
}
.rounded-sm {
  border-radius: calc(var(--radius) - 4px);
}
.rounded-xl {
  border-radius: 0.75rem;
}
.rounded-r-md {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.rounded-t-\[10px\] {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}
.rounded-tl-sm {
  border-top-left-radius: calc(var(--radius) - 4px);
}
.border {
  border-width: 1px;
}
.border-0 {
  border-width: 0px;
}
.border-2 {
  border-width: 2px;
}
.border-4 {
  border-width: 4px;
}
.border-\[1\.5px\] {
  border-width: 1.5px;
}
.border-y {
  border-top-width: 1px;
  border-bottom-width: 1px;
}
.border-b {
  border-bottom-width: 1px;
}
.border-l {
  border-left-width: 1px;
}
.border-l-2 {
  border-left-width: 2px;
}
.border-r {
  border-right-width: 1px;
}
.border-t {
  border-top-width: 1px;
}
.border-dashed {
  border-style: dashed;
}
.border-none {
  border-style: none;
}
.border-\[--color-border\] {
  border-color: var(--color-border);
}
.border-accent {
  border-color: hsl(var(--accent));
}
.border-accent\/20 {
  border-color: hsl(var(--accent) / 0.2);
}
.border-accent\/30 {
  border-color: hsl(var(--accent) / 0.3);
}
.border-accent\/40 {
  border-color: hsl(var(--accent) / 0.4);
}
.border-background\/20 {
  border-color: hsl(var(--background) / 0.2);
}
.border-blue-500\/20 {
  border-color: rgb(59 130 246 / 0.2);
}
.border-border {
  border-color: hsl(var(--border));
}
.border-border\/50 {
  border-color: hsl(var(--border) / 0.5);
}
.border-border\/60 {
  border-color: hsl(var(--border) / 0.6);
}
.border-border\/80 {
  border-color: hsl(var(--border) / 0.8);
}
.border-current {
  border-color: currentColor;
}
.border-destructive {
  border-color: hsl(var(--destructive));
}
.border-destructive\/10 {
  border-color: hsl(var(--destructive) / 0.1);
}
.border-destructive\/20 {
  border-color: hsl(var(--destructive) / 0.2);
}
.border-destructive\/30 {
  border-color: hsl(var(--destructive) / 0.3);
}
.border-destructive\/50 {
  border-color: hsl(var(--destructive) / 0.5);
}
.border-green-500 {
  --tw-border-opacity: 1;
  border-color: rgb(34 197 94 / var(--tw-border-opacity, 1));
}
.border-green-500\/30 {
  border-color: rgb(34 197 94 / 0.3);
}
.border-input {
  border-color: hsl(var(--input));
}
.border-muted {
  border-color: hsl(var(--muted));
}
.border-primary {
  border-color: hsl(var(--primary));
}
.border-primary\/20 {
  border-color: hsl(var(--primary) / 0.2);
}
.border-primary\/30 {
  border-color: hsl(var(--primary) / 0.3);
}
.border-primary\/45 {
  border-color: hsl(var(--primary) / 0.45);
}
.border-sidebar-border {
  border-color: hsl(var(--sidebar-border));
}
.border-transparent {
  border-color: transparent;
}
.border-warning\/20 {
  border-color: hsl(var(--warning) / 0.2);
}
.border-warning\/30 {
  border-color: hsl(var(--warning) / 0.3);
}
.border-warning\/40 {
  border-color: hsl(var(--warning) / 0.4);
}
.border-l-transparent {
  border-left-color: transparent;
}
.border-t-transparent {
  border-top-color: transparent;
}
.bg-\[\#2d5a27\] {
  --tw-bg-opacity: 1;
  background-color: rgb(45 90 39 / var(--tw-bg-opacity, 1));
}
.bg-\[--color-bg\] {
  background-color: var(--color-bg);
}
.bg-accent {
  background-color: hsl(var(--accent));
}
.bg-accent\/10 {
  background-color: hsl(var(--accent) / 0.1);
}
.bg-accent\/15 {
  background-color: hsl(var(--accent) / 0.15);
}
.bg-accent\/20 {
  background-color: hsl(var(--accent) / 0.2);
}
.bg-accent\/5 {
  background-color: hsl(var(--accent) / 0.05);
}
.bg-background {
  background-color: hsl(var(--background));
}
.bg-background\/15 {
  background-color: hsl(var(--background) / 0.15);
}
.bg-background\/60 {
  background-color: hsl(var(--background) / 0.6);
}
.bg-background\/80 {
  background-color: hsl(var(--background) / 0.8);
}
.bg-background\/95 {
  background-color: hsl(var(--background) / 0.95);
}
.bg-black\/40 {
  background-color: rgb(0 0 0 / 0.4);
}
.bg-black\/80 {
  background-color: rgb(0 0 0 / 0.8);
}
.bg-blue-500\/10 {
  background-color: rgb(59 130 246 / 0.1);
}
.bg-border {
  background-color: hsl(var(--border));
}
.bg-card {
  background-color: hsl(var(--card));
}
.bg-card\/95 {
  background-color: hsl(var(--card) / 0.95);
}
.bg-destructive {
  background-color: hsl(var(--destructive));
}
.bg-destructive\/10 {
  background-color: hsl(var(--destructive) / 0.1);
}
.bg-destructive\/15 {
  background-color: hsl(var(--destructive) / 0.15);
}
.bg-destructive\/5 {
  background-color: hsl(var(--destructive) / 0.05);
}
.bg-foreground {
  background-color: hsl(var(--foreground));
}
.bg-foreground\/10 {
  background-color: hsl(var(--foreground) / 0.1);
}
.bg-foreground\/90 {
  background-color: hsl(var(--foreground) / 0.9);
}
.bg-green-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(34 197 94 / var(--tw-bg-opacity, 1));
}
.bg-green-500\/10 {
  background-color: rgb(34 197 94 / 0.1);
}
.bg-info\/10 {
  background-color: hsl(var(--info) / 0.1);
}
.bg-muted {
  background-color: hsl(var(--muted));
}
.bg-muted\/20 {
  background-color: hsl(var(--muted) / 0.2);
}
.bg-muted\/30 {
  background-color: hsl(var(--muted) / 0.3);
}
.bg-muted\/40 {
  background-color: hsl(var(--muted) / 0.4);
}
.bg-muted\/50 {
  background-color: hsl(var(--muted) / 0.5);
}
.bg-popover {
  background-color: hsl(var(--popover));
}
.bg-primary {
  background-color: hsl(var(--primary));
}
.bg-primary\/10 {
  background-color: hsl(var(--primary) / 0.1);
}
.bg-primary\/15 {
  background-color: hsl(var(--primary) / 0.15);
}
.bg-primary\/5 {
  background-color: hsl(var(--primary) / 0.05);
}
.bg-secondary {
  background-color: hsl(var(--secondary));
}
.bg-secondary\/40 {
  background-color: hsl(var(--secondary) / 0.4);
}
.bg-sidebar {
  background-color: hsl(var(--sidebar-background));
}
.bg-sidebar-accent\/5 {
  background-color: hsl(var(--sidebar-accent) / 0.05);
}
.bg-sidebar-border {
  background-color: hsl(var(--sidebar-border));
}
.bg-transparent {
  background-color: transparent;
}
.bg-warning\/10 {
  background-color: hsl(var(--warning) / 0.1);
}
.bg-warning\/20 {
  background-color: hsl(var(--warning) / 0.2);
}
.bg-warning\/30 {
  background-color: hsl(var(--warning) / 0.3);
}
.bg-white\/20 {
  background-color: rgb(255 255 255 / 0.2);
}
.bg-\[radial-gradient\(circle_at_top_right\2c hsl\(var\(--accent\)\/0\.25\)\2c transparent_60\%\)\] {
  background-image: radial-gradient(circle at top right,hsl(var(--accent)/0.25),transparent 60%);
}
.bg-gradient-to-b {
  background-image: linear-gradient(to bottom, var(--tw-gradient-stops));
}
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}
.from-\[hsl\(220\2c 30\%\2c 22\%\)\] {
  --tw-gradient-from: hsl(220,30%,22%) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(220 30% 22% / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.from-foreground\/90 {
  --tw-gradient-from: hsl(var(--foreground) / 0.9) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(var(--foreground) / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.from-primary {
  --tw-gradient-from: hsl(var(--primary)) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(var(--primary) / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.via-\[hsl\(220\2c 30\%\2c 18\%\)\] {
  --tw-gradient-to: hsl(220 30% 18% / 0)  var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), hsl(220,30%,18%) var(--tw-gradient-via-position), var(--tw-gradient-to);
}
.via-foreground\/70 {
  --tw-gradient-to: hsl(var(--foreground) / 0)  var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), hsl(var(--foreground) / 0.7) var(--tw-gradient-via-position), var(--tw-gradient-to);
}
.to-\[hsl\(158\2c 40\%\2c 22\%\)\] {
  --tw-gradient-to: hsl(158,40%,22%) var(--tw-gradient-to-position);
}
.to-accent {
  --tw-gradient-to: hsl(var(--accent)) var(--tw-gradient-to-position);
}
.to-foreground\/20 {
  --tw-gradient-to: hsl(var(--foreground) / 0.2) var(--tw-gradient-to-position);
}
.fill-accent {
  fill: hsl(var(--accent));
}
.fill-current {
  fill: currentColor;
}
.fill-yellow-400 {
  fill: #facc15;
}
.stroke-accent {
  stroke: hsl(var(--accent));
}
.stroke-destructive {
  stroke: hsl(var(--destructive));
}
.stroke-muted {
  stroke: hsl(var(--muted));
}
.stroke-primary {
  stroke: hsl(var(--primary));
}
.object-contain {
  -o-object-fit: contain;
     object-fit: contain;
}
.object-cover {
  -o-object-fit: cover;
     object-fit: cover;
}
.p-0 {
  padding: 0px;
}
.p-0\.5 {
  padding: 0.125rem;
}
.p-1 {
  padding: 0.25rem;
}
.p-2 {
  padding: 0.5rem;
}
.p-3 {
  padding: 0.75rem;
}
.p-3\.5 {
  padding: 0.875rem;
}
.p-4 {
  padding: 1rem;
}
.p-5 {
  padding: 1.25rem;
}
.p-6 {
  padding: 1.5rem;
}
.p-7 {
  padding: 1.75rem;
}
.p-8 {
  padding: 2rem;
}
.p-\[1px\] {
  padding: 1px;
}
.px-1 {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
.px-1\.5 {
  padding-left: 0.375rem;
  padding-right: 0.375rem;
}
.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.px-2\.5 {
  padding-left: 0.625rem;
  padding-right: 0.625rem;
}
.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.px-5 {
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}
.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.px-8 {
  padding-left: 2rem;
  padding-right: 2rem;
}
.py-0\.5 {
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
}
.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
.py-1\.5 {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
.py-10 {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}
.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.py-2\.5 {
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
}
.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.py-6 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}
.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
.pb-2 {
  padding-bottom: 0.5rem;
}
.pb-20 {
  padding-bottom: 5rem;
}
.pb-24 {
  padding-bottom: 6rem;
}
.pb-3 {
  padding-bottom: 0.75rem;
}
.pb-4 {
  padding-bottom: 1rem;
}
.pb-6 {
  padding-bottom: 1.5rem;
}
.pl-10 {
  padding-left: 2.5rem;
}
.pl-2 {
  padding-left: 0.5rem;
}
.pl-2\.5 {
  padding-left: 0.625rem;
}
.pl-4 {
  padding-left: 1rem;
}
.pl-8 {
  padding-left: 2rem;
}
.pl-9 {
  padding-left: 2.25rem;
}
.pr-1 {
  padding-right: 0.25rem;
}
.pr-12 {
  padding-right: 3rem;
}
.pr-2 {
  padding-right: 0.5rem;
}
.pr-2\.5 {
  padding-right: 0.625rem;
}
.pr-4 {
  padding-right: 1rem;
}
.pr-8 {
  padding-right: 2rem;
}
.pt-0 {
  padding-top: 0px;
}
.pt-1 {
  padding-top: 0.25rem;
}
.pt-2 {
  padding-top: 0.5rem;
}
.pt-3 {
  padding-top: 0.75rem;
}
.pt-4 {
  padding-top: 1rem;
}
.pt-5 {
  padding-top: 1.25rem;
}
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.align-middle {
  vertical-align: middle;
}
.font-body {
  font-family: Geist, sans-serif;
}
.font-heading {
  font-family: "Be Vietnam Pro", sans-serif;
}
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.\!text-\[13px\] {
  font-size: 13px !important;
}
.\!text-\[14px\] {
  font-size: 14px !important;
}
.\!text-\[16px\] {
  font-size: 16px !important;
}
.\!text-\[18px\] {
  font-size: 18px !important;
}
.\!text-\[20px\] {
  font-size: 20px !important;
}
.\!text-\[22px\] {
  font-size: 22px !important;
}
.\!text-\[28px\] {
  font-size: 28px !important;
}
.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}
.text-4xl {
  font-size: 2.25rem;
  line-height: 2.5rem;
}
.text-5xl {
  font-size: 3rem;
  line-height: 1;
}
.text-\[0\.8rem\] {
  font-size: 0.8rem;
}
.text-\[10px\] {
  font-size: 10px;
}
.text-\[11px\] {
  font-size: 11px;
}
.text-\[180px\] {
  font-size: 180px;
}
.text-\[9px\] {
  font-size: 9px;
}
.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}
.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}
.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}
.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}
.font-black {
  font-weight: 900;
}
.font-bold {
  font-weight: 700;
}
.font-extrabold {
  font-weight: 800;
}
.font-medium {
  font-weight: 500;
}
.font-normal {
  font-weight: 400;
}
.font-semibold {
  font-weight: 600;
}
.uppercase {
  text-transform: uppercase;
}
.italic {
  font-style: italic;
}
.tabular-nums {
  --tw-numeric-spacing: tabular-nums;
  font-variant-numeric: var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction);
}
.leading-\[1\.05\] {
  line-height: 1.05;
}
.leading-none {
  line-height: 1;
}
.leading-relaxed {
  line-height: 1.625;
}
.leading-snug {
  line-height: 1.375;
}
.leading-tight {
  line-height: 1.25;
}
.tracking-\[0\.18em\] {
  letter-spacing: 0.18em;
}
.tracking-tight {
  letter-spacing: -0.025em;
}
.tracking-tighter {
  letter-spacing: -0.05em;
}
.tracking-wide {
  letter-spacing: 0.025em;
}
.tracking-wider {
  letter-spacing: 0.05em;
}
.tracking-widest {
  letter-spacing: 0.1em;
}
.text-accent {
  color: hsl(var(--accent));
}
.text-accent-foreground {
  color: hsl(var(--accent-foreground));
}
.text-accent\/40 {
  color: hsl(var(--accent) / 0.4);
}
.text-background {
  color: hsl(var(--background));
}
.text-background\/40 {
  color: hsl(var(--background) / 0.4);
}
.text-background\/65 {
  color: hsl(var(--background) / 0.65);
}
.text-background\/70 {
  color: hsl(var(--background) / 0.7);
}
.text-background\/75 {
  color: hsl(var(--background) / 0.75);
}
.text-blue-600 {
  --tw-text-opacity: 1;
  color: rgb(37 99 235 / var(--tw-text-opacity, 1));
}
.text-card-foreground {
  color: hsl(var(--card-foreground));
}
.text-current {
  color: currentColor;
}
.text-destructive {
  color: hsl(var(--destructive));
}
.text-destructive-foreground {
  color: hsl(var(--destructive-foreground));
}
.text-foreground {
  color: hsl(var(--foreground));
}
.text-foreground\/15 {
  color: hsl(var(--foreground) / 0.15);
}
.text-foreground\/50 {
  color: hsl(var(--foreground) / 0.5);
}
.text-foreground\/70 {
  color: hsl(var(--foreground) / 0.7);
}
.text-foreground\/80 {
  color: hsl(var(--foreground) / 0.8);
}
.text-foreground\/90 {
  color: hsl(var(--foreground) / 0.9);
}
.text-green-300 {
  --tw-text-opacity: 1;
  color: rgb(134 239 172 / var(--tw-text-opacity, 1));
}
.text-green-700 {
  --tw-text-opacity: 1;
  color: rgb(21 128 61 / var(--tw-text-opacity, 1));
}
.text-info {
  color: hsl(var(--info));
}
.text-muted-foreground {
  color: hsl(var(--muted-foreground));
}
.text-popover-foreground {
  color: hsl(var(--popover-foreground));
}
.text-primary {
  color: hsl(var(--primary));
}
.text-primary-foreground {
  color: hsl(var(--primary-foreground));
}
.text-primary\/70 {
  color: hsl(var(--primary) / 0.7);
}
.text-secondary-foreground {
  color: hsl(var(--secondary-foreground));
}
.text-sidebar-foreground {
  color: hsl(var(--sidebar-foreground));
}
.text-sidebar-foreground\/50 {
  color: hsl(var(--sidebar-foreground) / 0.5);
}
.text-sidebar-foreground\/60 {
  color: hsl(var(--sidebar-foreground) / 0.6);
}
.text-sidebar-foreground\/70 {
  color: hsl(var(--sidebar-foreground) / 0.7);
}
.text-sidebar-foreground\/80 {
  color: hsl(var(--sidebar-foreground) / 0.8);
}
.text-sidebar-primary {
  color: hsl(var(--sidebar-primary));
}
.text-warning {
  color: hsl(var(--warning));
}
.text-warning-foreground {
  color: hsl(var(--warning-foreground));
}
.text-white {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}
.text-white\/70 {
  color: rgb(255 255 255 / 0.7);
}
.text-white\/80 {
  color: rgb(255 255 255 / 0.8);
}
.text-white\/90 {
  color: rgb(255 255 255 / 0.9);
}
.text-yellow-400 {
  --tw-text-opacity: 1;
  color: rgb(250 204 21 / var(--tw-text-opacity, 1));
}
.text-yellow-700 {
  --tw-text-opacity: 1;
  color: rgb(161 98 7 / var(--tw-text-opacity, 1));
}
.underline {
  text-decoration-line: underline;
}
.line-through {
  text-decoration-line: line-through;
}
.underline-offset-4 {
  text-underline-offset: 4px;
}
.accent-primary {
  accent-color: hsl(var(--primary));
}
.opacity-0 {
  opacity: 0;
}
.opacity-10 {
  opacity: 0.1;
}
.opacity-15 {
  opacity: 0.15;
}
.opacity-25 {
  opacity: 0.25;
}
.opacity-50 {
  opacity: 0.5;
}
.opacity-60 {
  opacity: 0.6;
}
.opacity-70 {
  opacity: 0.7;
}
.opacity-75 {
  opacity: 0.75;
}
.opacity-80 {
  opacity: 0.8;
}
.opacity-90 {
  opacity: 0.9;
}
.shadow {
  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-2xl {
  --tw-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --tw-shadow-colored: 0 25px 50px -12px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-\[0_0_0_1px_hsl\(var\(--sidebar-border\)\)\] {
  --tw-shadow: 0 0 0 1px hsl(var(--sidebar-border));
  --tw-shadow-colored: 0 0 0 1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-md {
  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-none {
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-sm {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-xl {
  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.shadow-primary\/10 {
  --tw-shadow-color: hsl(var(--primary) / 0.1);
  --tw-shadow: var(--tw-shadow-colored);
}
.shadow-primary\/20 {
  --tw-shadow-color: hsl(var(--primary) / 0.2);
  --tw-shadow: var(--tw-shadow-colored);
}
.outline-none {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.outline {
  outline-style: solid;
}
.ring {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-0 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-2 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-4 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.ring-accent\/50 {
  --tw-ring-color: hsl(var(--accent) / 0.5);
}
.ring-foreground\/30 {
  --tw-ring-color: hsl(var(--foreground) / 0.3);
}
.ring-green-500\/30 {
  --tw-ring-color: rgb(34 197 94 / 0.3);
}
.ring-primary\/40 {
  --tw-ring-color: hsl(var(--primary) / 0.4);
}
.ring-ring {
  --tw-ring-color: hsl(var(--ring));
}
.ring-sidebar-ring {
  --tw-ring-color: hsl(var(--sidebar-ring));
}
.ring-offset-1 {
  --tw-ring-offset-width: 1px;
}
.ring-offset-2 {
  --tw-ring-offset-width: 2px;
}
.ring-offset-background {
  --tw-ring-offset-color: hsl(var(--background));
}
.blur-lg {
  --tw-blur: blur(16px);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.drop-shadow-md {
  --tw-drop-shadow: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.filter {
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.backdrop-blur {
  --tw-backdrop-blur: blur(8px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.backdrop-blur-md {
  --tw-backdrop-blur: blur(12px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.backdrop-blur-sm {
  --tw-backdrop-blur: blur(4px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.backdrop-blur-xl {
  --tw-backdrop-blur: blur(24px);
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[left\2c right\2c width\] {
  transition-property: left,right,width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[margin\2c opa\] {
  transition-property: margin,opa;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[width\2c height\2c padding\] {
  transition-property: width,height,padding;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-\[width\] {
  transition-property: width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.duration-1000 {
  transition-duration: 1000ms;
}
.duration-200 {
  transition-duration: 200ms;
}
.duration-300 {
  transition-duration: 300ms;
}
.duration-500 {
  transition-duration: 500ms;
}
.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.ease-linear {
  transition-timing-function: linear;
}
@keyframes enter {

  from {
    opacity: var(--tw-enter-opacity, 1);
    transform: translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0));
  }
}
@keyframes exit {

  to {
    opacity: var(--tw-exit-opacity, 1);
    transform: translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0));
  }
}
.animate-in {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.fade-in {
  --tw-enter-opacity: 0;
}
.fade-in-0 {
  --tw-enter-opacity: 0;
}
.fade-in-80 {
  --tw-enter-opacity: 0.8;
}
.zoom-in-95 {
  --tw-enter-scale: .95;
}
.duration-1000 {
  animation-duration: 1000ms;
}
.duration-200 {
  animation-duration: 200ms;
}
.duration-300 {
  animation-duration: 300ms;
}
.duration-500 {
  animation-duration: 500ms;
}
.ease-in-out {
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.ease-linear {
  animation-timing-function: linear;
}
.running {
  animation-play-state: running;
}
/* 3D flip support */
.perspective-1000 {
    perspective: 1000px;
  }
.transform-style-3d {
    transform-style: preserve-3d;
  }
.backface-hidden {
    backface-visibility: hidden;
  }
.rotate-y-180 {
    transform: rotateY(180deg);
  }

/* Fonts loaded via index.html for Be Vietnam Pro + Geist + Material Symbols */

/* ── Keyframes ── */

@keyframes celebrate {
  0%   { transform: scale(1) rotate(0deg); }
  30%  { transform: scale(1.25) rotate(-4deg); }
  60%  { transform: scale(1.1) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.celebrate {
  animation: celebrate 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-up-fade {
  animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-6px); }
  30%       { transform: translateX(6px); }
  45%       { transform: translateX(-4px); }
  60%       { transform: translateX(4px); }
  75%       { transform: translateX(-2px); }
  90%       { transform: translateX(2px); }
}
.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes spin-slow {
  to { transform: rotate(360deg); }
}
.spin-slow {
  animation: spin-slow 0.9s linear infinite;
}
.file\:border-0::file-selector-button {
  border-width: 0px;
}
.file\:bg-transparent::file-selector-button {
  background-color: transparent;
}
.file\:text-sm::file-selector-button {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.file\:font-medium::file-selector-button {
  font-weight: 500;
}
.file\:text-foreground::file-selector-button {
  color: hsl(var(--foreground));
}
.placeholder\:text-muted-foreground::-moz-placeholder {
  color: hsl(var(--muted-foreground));
}
.placeholder\:text-muted-foreground::placeholder {
  color: hsl(var(--muted-foreground));
}
.after\:absolute::after {
  content: var(--tw-content);
  position: absolute;
}
.after\:-inset-2::after {
  content: var(--tw-content);
  inset: -0.5rem;
}
.after\:inset-y-0::after {
  content: var(--tw-content);
  top: 0px;
  bottom: 0px;
}
.after\:left-1\/2::after {
  content: var(--tw-content);
  left: 50%;
}
.after\:w-1::after {
  content: var(--tw-content);
  width: 0.25rem;
}
.after\:w-\[2px\]::after {
  content: var(--tw-content);
  width: 2px;
}
.after\:-translate-x-1\/2::after {
  content: var(--tw-content);
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.first\:rounded-l-md:first-child {
  border-top-left-radius: calc(var(--radius) - 2px);
  border-bottom-left-radius: calc(var(--radius) - 2px);
}
.first\:border-l:first-child {
  border-left-width: 1px;
}
.last\:rounded-r-md:last-child {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.focus-within\:relative:focus-within {
  position: relative;
}
.focus-within\:z-20:focus-within {
  z-index: 20;
}
.hover\:-translate-y-1:hover {
  --tw-translate-y: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.hover\:border-foreground\/30:hover {
  border-color: hsl(var(--foreground) / 0.3);
}
.hover\:border-primary:hover {
  border-color: hsl(var(--primary));
}
.hover\:border-primary\/30:hover {
  border-color: hsl(var(--primary) / 0.3);
}
.hover\:border-primary\/50:hover {
  border-color: hsl(var(--primary) / 0.5);
}
.hover\:border-primary\/80:hover {
  border-color: hsl(var(--primary) / 0.8);
}
.hover\:bg-accent:hover {
  background-color: hsl(var(--accent));
}
.hover\:bg-accent\/50:hover {
  background-color: hsl(var(--accent) / 0.5);
}
.hover\:bg-accent\/90:hover {
  background-color: hsl(var(--accent) / 0.9);
}
.hover\:bg-background:hover {
  background-color: hsl(var(--background));
}
.hover\:bg-destructive\/10:hover {
  background-color: hsl(var(--destructive) / 0.1);
}
.hover\:bg-destructive\/80:hover {
  background-color: hsl(var(--destructive) / 0.8);
}
.hover\:bg-muted:hover {
  background-color: hsl(var(--muted));
}
.hover\:bg-muted\/30:hover {
  background-color: hsl(var(--muted) / 0.3);
}
.hover\:bg-muted\/50:hover {
  background-color: hsl(var(--muted) / 0.5);
}
.hover\:bg-muted\/80:hover {
  background-color: hsl(var(--muted) / 0.8);
}
.hover\:bg-primary:hover {
  background-color: hsl(var(--primary));
}
.hover\:bg-primary\/10:hover {
  background-color: hsl(var(--primary) / 0.1);
}
.hover\:bg-primary\/20:hover {
  background-color: hsl(var(--primary) / 0.2);
}
.hover\:bg-primary\/80:hover {
  background-color: hsl(var(--primary) / 0.8);
}
.hover\:bg-primary\/95:hover {
  background-color: hsl(var(--primary) / 0.95);
}
.hover\:bg-secondary:hover {
  background-color: hsl(var(--secondary));
}
.hover\:bg-secondary\/80:hover {
  background-color: hsl(var(--secondary) / 0.8);
}
.hover\:bg-sidebar-accent:hover {
  background-color: hsl(var(--sidebar-accent));
}
.hover\:bg-sidebar-accent\/10:hover {
  background-color: hsl(var(--sidebar-accent) / 0.1);
}
.hover\:bg-warning\/15:hover {
  background-color: hsl(var(--warning) / 0.15);
}
.hover\:bg-white\/30:hover {
  background-color: rgb(255 255 255 / 0.3);
}
.hover\:text-accent-foreground:hover {
  color: hsl(var(--accent-foreground));
}
.hover\:text-destructive:hover {
  color: hsl(var(--destructive));
}
.hover\:text-foreground:hover {
  color: hsl(var(--foreground));
}
.hover\:text-muted-foreground:hover {
  color: hsl(var(--muted-foreground));
}
.hover\:text-primary-foreground:hover {
  color: hsl(var(--primary-foreground));
}
.hover\:text-primary\/90:hover {
  color: hsl(var(--primary) / 0.9);
}
.hover\:text-sidebar-accent-foreground:hover {
  color: hsl(var(--sidebar-accent-foreground));
}
.hover\:text-sidebar-foreground:hover {
  color: hsl(var(--sidebar-foreground));
}
.hover\:underline:hover {
  text-decoration-line: underline;
}
.hover\:opacity-100:hover {
  opacity: 1;
}
.hover\:opacity-85:hover {
  opacity: 0.85;
}
.hover\:opacity-90:hover {
  opacity: 0.9;
}
.hover\:opacity-95:hover {
  opacity: 0.95;
}
.hover\:shadow-\[0_0_0_1px_hsl\(var\(--sidebar-accent\)\)\]:hover {
  --tw-shadow: 0 0 0 1px hsl(var(--sidebar-accent));
  --tw-shadow-colored: 0 0 0 1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:shadow-lg:hover {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:shadow-md:hover {
  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:shadow-xl:hover {
  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hover\:brightness-95:hover {
  --tw-brightness: brightness(.95);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.hover\:after\:bg-sidebar-border:hover::after {
  content: var(--tw-content);
  background-color: hsl(var(--sidebar-border));
}
.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
.focus\:fixed:focus {
  position: fixed;
}
.focus\:left-4:focus {
  left: 1rem;
}
.focus\:top-4:focus {
  top: 1rem;
}
.focus\:z-\[9999\]:focus {
  z-index: 9999;
}
.focus\:rounded-lg:focus {
  border-radius: var(--radius);
}
.focus\:bg-accent:focus {
  background-color: hsl(var(--accent));
}
.focus\:bg-primary:focus {
  background-color: hsl(var(--primary));
}
.focus\:px-4:focus {
  padding-left: 1rem;
  padding-right: 1rem;
}
.focus\:py-2:focus {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.focus\:font-semibold:focus {
  font-weight: 600;
}
.focus\:text-accent-foreground:focus {
  color: hsl(var(--accent-foreground));
}
.focus\:text-primary-foreground:focus {
  color: hsl(var(--primary-foreground));
}
.focus\:opacity-100:focus {
  opacity: 1;
}
.focus\:shadow-lg:focus {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.focus\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.focus\:ring-2:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.focus\:ring-primary:focus {
  --tw-ring-color: hsl(var(--primary));
}
.focus\:ring-ring:focus {
  --tw-ring-color: hsl(var(--ring));
}
.focus\:ring-offset-2:focus {
  --tw-ring-offset-width: 2px;
}
.focus-visible\:border-primary:focus-visible {
  border-color: hsl(var(--primary));
}
.focus-visible\:underline:focus-visible {
  text-decoration-line: underline;
}
.focus-visible\:outline-none:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.focus-visible\:ring-1:focus-visible {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.focus-visible\:ring-2:focus-visible {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
.focus-visible\:ring-inset:focus-visible {
  --tw-ring-inset: inset;
}
.focus-visible\:ring-destructive:focus-visible {
  --tw-ring-color: hsl(var(--destructive));
}
.focus-visible\:ring-primary:focus-visible {
  --tw-ring-color: hsl(var(--primary));
}
.focus-visible\:ring-ring:focus-visible {
  --tw-ring-color: hsl(var(--ring));
}
.focus-visible\:ring-sidebar-ring:focus-visible {
  --tw-ring-color: hsl(var(--sidebar-ring));
}
.focus-visible\:ring-offset-1:focus-visible {
  --tw-ring-offset-width: 1px;
}
.focus-visible\:ring-offset-2:focus-visible {
  --tw-ring-offset-width: 2px;
}
.focus-visible\:ring-offset-background:focus-visible {
  --tw-ring-offset-color: hsl(var(--background));
}
.active\:scale-95:active {
  --tw-scale-x: .95;
  --tw-scale-y: .95;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\:scale-\[0\.98\]:active {
  --tw-scale-x: 0.98;
  --tw-scale-y: 0.98;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\:scale-\[0\.99\]:active {
  --tw-scale-x: 0.99;
  --tw-scale-y: 0.99;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\:bg-sidebar-accent:active {
  background-color: hsl(var(--sidebar-accent));
}
.active\:text-sidebar-accent-foreground:active {
  color: hsl(var(--sidebar-accent-foreground));
}
.disabled\:pointer-events-none:disabled {
  pointer-events: none;
}
.disabled\:cursor-not-allowed:disabled {
  cursor: not-allowed;
}
.disabled\:opacity-30:disabled {
  opacity: 0.3;
}
.disabled\:opacity-40:disabled {
  opacity: 0.4;
}
.disabled\:opacity-50:disabled {
  opacity: 0.5;
}
.group\/menu-item:focus-within .group-focus-within\/menu-item\:opacity-100 {
  opacity: 1;
}
.group:hover .group-hover\:translate-x-0\.5 {
  --tw-translate-x: 0.125rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group:hover .group-hover\:scale-105 {
  --tw-scale-x: 1.05;
  --tw-scale-y: 1.05;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group:hover .group-hover\:gap-2 {
  gap: 0.5rem;
}
.group:hover .group-hover\:border-foreground\/20 {
  border-color: hsl(var(--foreground) / 0.2);
}
.group:hover .group-hover\:text-primary {
  color: hsl(var(--primary));
}
.group\/menu-item:hover .group-hover\/menu-item\:opacity-100 {
  opacity: 1;
}
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
.group.destructive .group-\[\.destructive\]\:border-muted\/40 {
  border-color: hsl(var(--muted) / 0.4);
}
.group.toaster .group-\[\.toaster\]\:border-border {
  border-color: hsl(var(--border));
}
.group.toast .group-\[\.toast\]\:bg-muted {
  background-color: hsl(var(--muted));
}
.group.toast .group-\[\.toast\]\:bg-primary {
  background-color: hsl(var(--primary));
}
.group.toaster .group-\[\.toaster\]\:bg-background {
  background-color: hsl(var(--background));
}
.group.destructive .group-\[\.destructive\]\:text-red-300 {
  --tw-text-opacity: 1;
  color: rgb(252 165 165 / var(--tw-text-opacity, 1));
}
.group.toast .group-\[\.toast\]\:text-muted-foreground {
  color: hsl(var(--muted-foreground));
}
.group.toast .group-\[\.toast\]\:text-primary-foreground {
  color: hsl(var(--primary-foreground));
}
.group.toaster .group-\[\.toaster\]\:text-foreground {
  color: hsl(var(--foreground));
}
.group.toaster .group-\[\.toaster\]\:shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.group.destructive .group-\[\.destructive\]\:hover\:border-destructive\/30:hover {
  border-color: hsl(var(--destructive) / 0.3);
}
.group.destructive .group-\[\.destructive\]\:hover\:bg-destructive:hover {
  background-color: hsl(var(--destructive));
}
.group.destructive .group-\[\.destructive\]\:hover\:text-destructive-foreground:hover {
  color: hsl(var(--destructive-foreground));
}
.group.destructive .group-\[\.destructive\]\:hover\:text-red-50:hover {
  --tw-text-opacity: 1;
  color: rgb(254 242 242 / var(--tw-text-opacity, 1));
}
.group.destructive .group-\[\.destructive\]\:focus\:ring-destructive:focus {
  --tw-ring-color: hsl(var(--destructive));
}
.group.destructive .group-\[\.destructive\]\:focus\:ring-red-400:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(248 113 113 / var(--tw-ring-opacity, 1));
}
.group.destructive .group-\[\.destructive\]\:focus\:ring-offset-red-600:focus {
  --tw-ring-offset-color: #dc2626;
}
.peer\/menu-button:hover ~ .peer-hover\/menu-button\:text-sidebar-accent-foreground {
  color: hsl(var(--sidebar-accent-foreground));
}
.peer:disabled ~ .peer-disabled\:cursor-not-allowed {
  cursor: not-allowed;
}
.peer:disabled ~ .peer-disabled\:opacity-70 {
  opacity: 0.7;
}
.has-\[\[data-variant\=inset\]\]\:bg-sidebar:has([data-variant=inset]) {
  background-color: hsl(var(--sidebar-background));
}
.has-\[\:disabled\]\:opacity-50:has(:disabled) {
  opacity: 0.5;
}
.group\/menu-item:has([data-sidebar=menu-action]) .group-has-\[\[data-sidebar\=menu-action\]\]\/menu-item\:pr-8 {
  padding-right: 2rem;
}
.aria-disabled\:pointer-events-none[aria-disabled="true"] {
  pointer-events: none;
}
.aria-disabled\:opacity-50[aria-disabled="true"] {
  opacity: 0.5;
}
.aria-selected\:bg-accent[aria-selected="true"] {
  background-color: hsl(var(--accent));
}
.aria-selected\:bg-accent\/50[aria-selected="true"] {
  background-color: hsl(var(--accent) / 0.5);
}
.aria-selected\:text-accent-foreground[aria-selected="true"] {
  color: hsl(var(--accent-foreground));
}
.aria-selected\:text-muted-foreground[aria-selected="true"] {
  color: hsl(var(--muted-foreground));
}
.aria-selected\:opacity-100[aria-selected="true"] {
  opacity: 1;
}
.aria-selected\:opacity-30[aria-selected="true"] {
  opacity: 0.3;
}
.data-\[disabled\=true\]\:pointer-events-none[data-disabled="true"] {
  pointer-events: none;
}
.data-\[disabled\]\:pointer-events-none[data-disabled] {
  pointer-events: none;
}
.data-\[panel-group-direction\=vertical\]\:h-px[data-panel-group-direction="vertical"] {
  height: 1px;
}
.data-\[panel-group-direction\=vertical\]\:w-full[data-panel-group-direction="vertical"] {
  width: 100%;
}
.data-\[side\=bottom\]\:translate-y-1[data-side="bottom"] {
  --tw-translate-y: 0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[side\=left\]\:-translate-x-1[data-side="left"] {
  --tw-translate-x: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[side\=right\]\:translate-x-1[data-side="right"] {
  --tw-translate-x: 0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[side\=top\]\:-translate-y-1[data-side="top"] {
  --tw-translate-y: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[state\=checked\]\:translate-x-5[data-state="checked"] {
  --tw-translate-x: 1.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[state\=unchecked\]\:translate-x-0[data-state="unchecked"] {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[swipe\=cancel\]\:translate-x-0[data-swipe="cancel"] {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[swipe\=end\]\:translate-x-\[var\(--radix-toast-swipe-end-x\)\][data-swipe="end"] {
  --tw-translate-x: var(--radix-toast-swipe-end-x);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[swipe\=move\]\:translate-x-\[var\(--radix-toast-swipe-move-x\)\][data-swipe="move"] {
  --tw-translate-x: var(--radix-toast-swipe-move-x);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
@keyframes accordion-up {

  from {
    height: var(--radix-accordion-content-height);
  }

  to {
    height: 0;
  }
}
.data-\[state\=closed\]\:animate-accordion-up[data-state="closed"] {
  animation: accordion-up 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}
@keyframes accordion-down {

  from {
    height: 0;
  }

  to {
    height: var(--radix-accordion-content-height);
  }
}
.data-\[state\=open\]\:animate-accordion-down[data-state="open"] {
  animation: accordion-down 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}
.data-\[panel-group-direction\=vertical\]\:flex-col[data-panel-group-direction="vertical"] {
  flex-direction: column;
}
.data-\[active\=true\]\:bg-sidebar-accent[data-active="true"] {
  background-color: hsl(var(--sidebar-accent));
}
.data-\[active\]\:bg-accent\/50[data-active] {
  background-color: hsl(var(--accent) / 0.5);
}
.data-\[selected\=\'true\'\]\:bg-accent[data-selected='true'] {
  background-color: hsl(var(--accent));
}
.data-\[state\=active\]\:bg-background[data-state="active"] {
  background-color: hsl(var(--background));
}
.data-\[state\=checked\]\:bg-primary[data-state="checked"] {
  background-color: hsl(var(--primary));
}
.data-\[state\=on\]\:bg-accent[data-state="on"] {
  background-color: hsl(var(--accent));
}
.data-\[state\=open\]\:bg-accent[data-state="open"] {
  background-color: hsl(var(--accent));
}
.data-\[state\=open\]\:bg-accent\/50[data-state="open"] {
  background-color: hsl(var(--accent) / 0.5);
}
.data-\[state\=open\]\:bg-secondary[data-state="open"] {
  background-color: hsl(var(--secondary));
}
.data-\[state\=selected\]\:bg-muted[data-state="selected"] {
  background-color: hsl(var(--muted));
}
.data-\[state\=unchecked\]\:bg-input[data-state="unchecked"] {
  background-color: hsl(var(--input));
}
.data-\[active\=true\]\:font-medium[data-active="true"] {
  font-weight: 500;
}
.data-\[active\=true\]\:text-sidebar-accent-foreground[data-active="true"] {
  color: hsl(var(--sidebar-accent-foreground));
}
.data-\[selected\=true\]\:text-accent-foreground[data-selected="true"] {
  color: hsl(var(--accent-foreground));
}
.data-\[state\=active\]\:text-foreground[data-state="active"] {
  color: hsl(var(--foreground));
}
.data-\[state\=checked\]\:text-primary-foreground[data-state="checked"] {
  color: hsl(var(--primary-foreground));
}
.data-\[state\=on\]\:text-accent-foreground[data-state="on"] {
  color: hsl(var(--accent-foreground));
}
.data-\[state\=open\]\:text-accent-foreground[data-state="open"] {
  color: hsl(var(--accent-foreground));
}
.data-\[state\=open\]\:text-muted-foreground[data-state="open"] {
  color: hsl(var(--muted-foreground));
}
.data-\[disabled\=true\]\:opacity-50[data-disabled="true"] {
  opacity: 0.5;
}
.data-\[disabled\]\:opacity-50[data-disabled] {
  opacity: 0.5;
}
.data-\[state\=open\]\:opacity-100[data-state="open"] {
  opacity: 1;
}
.data-\[state\=active\]\:shadow-sm[data-state="active"] {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.data-\[swipe\=move\]\:transition-none[data-swipe="move"] {
  transition-property: none;
}
.data-\[state\=closed\]\:duration-300[data-state="closed"] {
  transition-duration: 300ms;
}
.data-\[state\=open\]\:duration-500[data-state="open"] {
  transition-duration: 500ms;
}
.data-\[motion\^\=from-\]\:animate-in[data-motion^="from-"] {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.data-\[state\=open\]\:animate-in[data-state="open"] {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.data-\[state\=visible\]\:animate-in[data-state="visible"] {
  animation-name: enter;
  animation-duration: 150ms;
  --tw-enter-opacity: initial;
  --tw-enter-scale: initial;
  --tw-enter-rotate: initial;
  --tw-enter-translate-x: initial;
  --tw-enter-translate-y: initial;
}
.data-\[motion\^\=to-\]\:animate-out[data-motion^="to-"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[state\=closed\]\:animate-out[data-state="closed"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[state\=hidden\]\:animate-out[data-state="hidden"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[swipe\=end\]\:animate-out[data-swipe="end"] {
  animation-name: exit;
  animation-duration: 150ms;
  --tw-exit-opacity: initial;
  --tw-exit-scale: initial;
  --tw-exit-rotate: initial;
  --tw-exit-translate-x: initial;
  --tw-exit-translate-y: initial;
}
.data-\[motion\^\=from-\]\:fade-in[data-motion^="from-"] {
  --tw-enter-opacity: 0;
}
.data-\[motion\^\=to-\]\:fade-out[data-motion^="to-"] {
  --tw-exit-opacity: 0;
}
.data-\[state\=closed\]\:fade-out-0[data-state="closed"] {
  --tw-exit-opacity: 0;
}
.data-\[state\=closed\]\:fade-out-80[data-state="closed"] {
  --tw-exit-opacity: 0.8;
}
.data-\[state\=hidden\]\:fade-out[data-state="hidden"] {
  --tw-exit-opacity: 0;
}
.data-\[state\=open\]\:fade-in-0[data-state="open"] {
  --tw-enter-opacity: 0;
}
.data-\[state\=visible\]\:fade-in[data-state="visible"] {
  --tw-enter-opacity: 0;
}
.data-\[state\=closed\]\:zoom-out-95[data-state="closed"] {
  --tw-exit-scale: .95;
}
.data-\[state\=open\]\:zoom-in-90[data-state="open"] {
  --tw-enter-scale: .9;
}
.data-\[state\=open\]\:zoom-in-95[data-state="open"] {
  --tw-enter-scale: .95;
}
.data-\[motion\=from-end\]\:slide-in-from-right-52[data-motion="from-end"] {
  --tw-enter-translate-x: 13rem;
}
.data-\[motion\=from-start\]\:slide-in-from-left-52[data-motion="from-start"] {
  --tw-enter-translate-x: -13rem;
}
.data-\[motion\=to-end\]\:slide-out-to-right-52[data-motion="to-end"] {
  --tw-exit-translate-x: 13rem;
}
.data-\[motion\=to-start\]\:slide-out-to-left-52[data-motion="to-start"] {
  --tw-exit-translate-x: -13rem;
}
.data-\[side\=bottom\]\:slide-in-from-top-2[data-side="bottom"] {
  --tw-enter-translate-y: -0.5rem;
}
.data-\[side\=left\]\:slide-in-from-right-2[data-side="left"] {
  --tw-enter-translate-x: 0.5rem;
}
.data-\[side\=right\]\:slide-in-from-left-2[data-side="right"] {
  --tw-enter-translate-x: -0.5rem;
}
.data-\[side\=top\]\:slide-in-from-bottom-2[data-side="top"] {
  --tw-enter-translate-y: 0.5rem;
}
.data-\[state\=closed\]\:slide-out-to-bottom[data-state="closed"] {
  --tw-exit-translate-y: 100%;
}
.data-\[state\=closed\]\:slide-out-to-left[data-state="closed"] {
  --tw-exit-translate-x: -100%;
}
.data-\[state\=closed\]\:slide-out-to-left-1\/2[data-state="closed"] {
  --tw-exit-translate-x: -50%;
}
.data-\[state\=closed\]\:slide-out-to-right[data-state="closed"] {
  --tw-exit-translate-x: 100%;
}
.data-\[state\=closed\]\:slide-out-to-right-full[data-state="closed"] {
  --tw-exit-translate-x: 100%;
}
.data-\[state\=closed\]\:slide-out-to-top[data-state="closed"] {
  --tw-exit-translate-y: -100%;
}
.data-\[state\=closed\]\:slide-out-to-top-\[48\%\][data-state="closed"] {
  --tw-exit-translate-y: -48%;
}
.data-\[state\=open\]\:slide-in-from-bottom[data-state="open"] {
  --tw-enter-translate-y: 100%;
}
.data-\[state\=open\]\:slide-in-from-left[data-state="open"] {
  --tw-enter-translate-x: -100%;
}
.data-\[state\=open\]\:slide-in-from-left-1\/2[data-state="open"] {
  --tw-enter-translate-x: -50%;
}
.data-\[state\=open\]\:slide-in-from-right[data-state="open"] {
  --tw-enter-translate-x: 100%;
}
.data-\[state\=open\]\:slide-in-from-top[data-state="open"] {
  --tw-enter-translate-y: -100%;
}
.data-\[state\=open\]\:slide-in-from-top-\[48\%\][data-state="open"] {
  --tw-enter-translate-y: -48%;
}
.data-\[state\=open\]\:slide-in-from-top-full[data-state="open"] {
  --tw-enter-translate-y: -100%;
}
.data-\[state\=closed\]\:duration-300[data-state="closed"] {
  animation-duration: 300ms;
}
.data-\[state\=open\]\:duration-500[data-state="open"] {
  animation-duration: 500ms;
}
.data-\[panel-group-direction\=vertical\]\:after\:left-0[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  left: 0px;
}
.data-\[panel-group-direction\=vertical\]\:after\:h-1[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  height: 0.25rem;
}
.data-\[panel-group-direction\=vertical\]\:after\:w-full[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  width: 100%;
}
.data-\[panel-group-direction\=vertical\]\:after\:-translate-y-1\/2[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[panel-group-direction\=vertical\]\:after\:translate-x-0[data-panel-group-direction="vertical"]::after {
  content: var(--tw-content);
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.data-\[state\=open\]\:hover\:bg-sidebar-accent:hover[data-state="open"] {
  background-color: hsl(var(--sidebar-accent));
}
.data-\[state\=open\]\:hover\:text-sidebar-accent-foreground:hover[data-state="open"] {
  color: hsl(var(--sidebar-accent-foreground));
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:left-\[calc\(var\(--sidebar-width\)\*-1\)\] {
  left: calc(var(--sidebar-width) * -1);
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:right-\[calc\(var\(--sidebar-width\)\*-1\)\] {
  right: calc(var(--sidebar-width) * -1);
}
.group[data-side="left"] .group-data-\[side\=left\]\:-right-4 {
  right: -1rem;
}
.group[data-side="right"] .group-data-\[side\=right\]\:left-0 {
  left: 0px;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:-mt-8 {
  margin-top: -2rem;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:hidden {
  display: none;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:\!size-8 {
  width: 2rem !important;
  height: 2rem !important;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:w-\[--sidebar-width-icon\] {
  width: var(--sidebar-width-icon);
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:w-\[calc\(var\(--sidebar-width-icon\)_\+_theme\(spacing\.4\)\)\] {
  width: calc(var(--sidebar-width-icon) + 1rem);
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:w-\[calc\(var\(--sidebar-width-icon\)_\+_theme\(spacing\.4\)_\+2px\)\] {
  width: calc(var(--sidebar-width-icon) + 1rem + 2px);
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:w-0 {
  width: 0px;
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:translate-x-0 {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group[data-side="right"] .group-data-\[side\=right\]\:rotate-180 {
  --tw-rotate: 180deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group[data-state="open"] .group-data-\[state\=open\]\:rotate-180 {
  --tw-rotate: 180deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:overflow-hidden {
  overflow: hidden;
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:rounded-lg {
  border-radius: var(--radius);
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:border {
  border-width: 1px;
}
.group[data-side="left"] .group-data-\[side\=left\]\:border-r {
  border-right-width: 1px;
}
.group[data-side="right"] .group-data-\[side\=right\]\:border-l {
  border-left-width: 1px;
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:border-sidebar-border {
  border-color: hsl(var(--sidebar-border));
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:\!p-0 {
  padding: 0px !important;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:\!p-2 {
  padding: 0.5rem !important;
}
.group[data-collapsible="icon"] .group-data-\[collapsible\=icon\]\:opacity-0 {
  opacity: 0;
}
.group[data-variant="floating"] .group-data-\[variant\=floating\]\:shadow {
  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:after\:left-full::after {
  content: var(--tw-content);
  left: 100%;
}
.group[data-collapsible="offcanvas"] .group-data-\[collapsible\=offcanvas\]\:hover\:bg-sidebar:hover {
  background-color: hsl(var(--sidebar-background));
}
.peer\/menu-button[data-size="default"] ~ .peer-data-\[size\=default\]\/menu-button\:top-1\.5 {
  top: 0.375rem;
}
.peer\/menu-button[data-size="lg"] ~ .peer-data-\[size\=lg\]\/menu-button\:top-2\.5 {
  top: 0.625rem;
}
.peer\/menu-button[data-size="sm"] ~ .peer-data-\[size\=sm\]\/menu-button\:top-1 {
  top: 0.25rem;
}
.peer[data-variant="inset"] ~ .peer-data-\[variant\=inset\]\:min-h-\[calc\(100svh-theme\(spacing\.4\)\)\] {
  min-height: calc(100svh - 1rem);
}
.peer\/menu-button[data-active="true"] ~ .peer-data-\[active\=true\]\/menu-button\:text-sidebar-accent-foreground {
  color: hsl(var(--sidebar-accent-foreground));
}
.dark\:border-destructive:is(.dark *) {
  border-color: hsl(var(--destructive));
}
.dark\:text-green-400:is(.dark *) {
  --tw-text-opacity: 1;
  color: rgb(74 222 128 / var(--tw-text-opacity, 1));
}
@media (min-width: 640px) {

  .sm\:bottom-0 {
    bottom: 0px;
  }

  .sm\:right-0 {
    right: 0px;
  }

  .sm\:top-\[73px\] {
    top: 73px;
  }

  .sm\:top-auto {
    top: auto;
  }

  .sm\:mt-0 {
    margin-top: 0px;
  }

  .sm\:block {
    display: block;
  }

  .sm\:inline-block {
    display: inline-block;
  }

  .sm\:flex {
    display: flex;
  }

  .sm\:h-52 {
    height: 13rem;
  }

  .sm\:w-64 {
    width: 16rem;
  }

  .sm\:w-auto {
    width: auto;
  }

  .sm\:max-w-md {
    max-width: 28rem;
  }

  .sm\:max-w-sm {
    max-width: 24rem;
  }

  .sm\:flex-none {
    flex: none;
  }

  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sm\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sm\:flex-row {
    flex-direction: row;
  }

  .sm\:flex-col {
    flex-direction: column;
  }

  .sm\:items-center {
    align-items: center;
  }

  .sm\:justify-end {
    justify-content: flex-end;
  }

  .sm\:gap-2\.5 {
    gap: 0.625rem;
  }

  .sm\:space-x-2 > :not([hidden]) ~ :not([hidden]) {
    --tw-space-x-reverse: 0;
    margin-right: calc(0.5rem * var(--tw-space-x-reverse));
    margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));
  }

  .sm\:space-x-4 > :not([hidden]) ~ :not([hidden]) {
    --tw-space-x-reverse: 0;
    margin-right: calc(1rem * var(--tw-space-x-reverse));
    margin-left: calc(1rem * calc(1 - var(--tw-space-x-reverse)));
  }

  .sm\:space-y-0 > :not([hidden]) ~ :not([hidden]) {
    --tw-space-y-reverse: 0;
    margin-top: calc(0px * calc(1 - var(--tw-space-y-reverse)));
    margin-bottom: calc(0px * var(--tw-space-y-reverse));
  }

  .sm\:rounded-lg {
    border-radius: var(--radius);
  }

  .sm\:p-8 {
    padding: 2rem;
  }

  .sm\:px-10 {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
  }

  .sm\:text-left {
    text-align: left;
  }

  .sm\:text-4xl {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }

  .data-\[state\=open\]\:sm\:slide-in-from-bottom-full[data-state="open"] {
    --tw-enter-translate-y: 100%;
  }
}
@media (min-width: 768px) {

  .md\:absolute {
    position: absolute;
  }

  .md\:mx-0 {
    margin-left: 0px;
    margin-right: 0px;
  }

  .md\:ml-60 {
    margin-left: 15rem;
  }

  .md\:block {
    display: block;
  }

  .md\:flex {
    display: flex;
  }

  .md\:grid {
    display: grid;
  }

  .md\:hidden {
    display: none;
  }

  .md\:h-44 {
    height: 11rem;
  }

  .md\:w-\[var\(--radix-navigation-menu-viewport-width\)\] {
    width: var(--radix-navigation-menu-viewport-width);
  }

  .md\:w-auto {
    width: auto;
  }

  .md\:min-w-0 {
    min-width: 0px;
  }

  .md\:max-w-\[420px\] {
    max-width: 420px;
  }

  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .md\:p-6 {
    padding: 1.5rem;
  }

  .md\:p-7 {
    padding: 1.75rem;
  }

  .md\:p-8 {
    padding: 2rem;
  }

  .md\:px-0 {
    padding-left: 0px;
    padding-right: 0px;
  }

  .md\:px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .md\:px-7 {
    padding-left: 1.75rem;
    padding-right: 1.75rem;
  }

  .md\:px-8 {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .md\:py-16 {
    padding-top: 4rem;
    padding-bottom: 4rem;
  }

  .md\:pb-0 {
    padding-bottom: 0px;
  }

  .md\:pb-8 {
    padding-bottom: 2rem;
  }

  .md\:text-3xl {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .md\:text-4xl {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }

  .md\:text-5xl {
    font-size: 3rem;
    line-height: 1;
  }

  .md\:text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .md\:text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }

  .md\:opacity-0 {
    opacity: 0;
  }

  .after\:md\:hidden::after {
    content: var(--tw-content);
    display: none;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:m-2 {
    margin: 0.5rem;
  }

  .peer[data-state="collapsed"][data-variant="inset"] ~ .md\:peer-data-\[state\=collapsed\]\:peer-data-\[variant\=inset\]\:ml-2 {
    margin-left: 0.5rem;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:ml-0 {
    margin-left: 0px;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:rounded-xl {
    border-radius: 0.75rem;
  }

  .peer[data-variant="inset"] ~ .md\:peer-data-\[variant\=inset\]\:shadow {
    --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }
}
@media (min-width: 1024px) {

  .lg\:col-span-2 {
    grid-column: span 2 / span 2;
  }

  .lg\:block {
    display: block;
  }

  .lg\:flex {
    display: flex;
  }

  .lg\:h-auto {
    height: auto;
  }

  .lg\:min-h-screen {
    min-height: 100vh;
  }

  .lg\:w-\[480px\] {
    width: 480px;
  }

  .lg\:flex-1 {
    flex: 1 1 0%;
  }

  .lg\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .lg\:grid-cols-\[1fr_1\.2fr\] {
    grid-template-columns: 1fr 1.2fr;
  }

  .lg\:grid-cols-\[1fr_320px\] {
    grid-template-columns: 1fr 320px;
  }

  .lg\:flex-row {
    flex-direction: row;
  }

  .lg\:bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
  }

  .lg\:p-12 {
    padding: 3rem;
  }

  .lg\:px-12 {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  .lg\:py-10 {
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
  }
}
@media (min-width: 1280px) {

  .xl\:w-\[520px\] {
    width: 520px;
  }

  .xl\:text-6xl {
    font-size: 3.75rem;
    line-height: 1;
  }
}
.\[\&\:has\(\[aria-selected\]\)\]\:bg-accent:has([aria-selected]) {
  background-color: hsl(var(--accent));
}
.first\:\[\&\:has\(\[aria-selected\]\)\]\:rounded-l-md:has([aria-selected]):first-child {
  border-top-left-radius: calc(var(--radius) - 2px);
  border-bottom-left-radius: calc(var(--radius) - 2px);
}
.last\:\[\&\:has\(\[aria-selected\]\)\]\:rounded-r-md:has([aria-selected]):last-child {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.\[\&\:has\(\[aria-selected\]\.day-outside\)\]\:bg-accent\/50:has([aria-selected].day-outside) {
  background-color: hsl(var(--accent) / 0.5);
}
.\[\&\:has\(\[aria-selected\]\.day-range-end\)\]\:rounded-r-md:has([aria-selected].day-range-end) {
  border-top-right-radius: calc(var(--radius) - 2px);
  border-bottom-right-radius: calc(var(--radius) - 2px);
}
.\[\&\:has\(\[role\=checkbox\]\)\]\:pr-0:has([role=checkbox]) {
  padding-right: 0px;
}
.\[\&\>button\]\:hidden>button {
  display: none;
}
.\[\&\>span\:last-child\]\:truncate>span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.\[\&\>span\]\:line-clamp-1>span {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}
.\[\&\>svg\+div\]\:translate-y-\[-3px\]>svg+div {
  --tw-translate-y: -3px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.\[\&\>svg\]\:absolute>svg {
  position: absolute;
}
.\[\&\>svg\]\:left-4>svg {
  left: 1rem;
}
.\[\&\>svg\]\:top-4>svg {
  top: 1rem;
}
.\[\&\>svg\]\:size-3\.5>svg {
  width: 0.875rem;
  height: 0.875rem;
}
.\[\&\>svg\]\:size-4>svg {
  width: 1rem;
  height: 1rem;
}
.\[\&\>svg\]\:h-2\.5>svg {
  height: 0.625rem;
}
.\[\&\>svg\]\:h-3>svg {
  height: 0.75rem;
}
.\[\&\>svg\]\:w-2\.5>svg {
  width: 0.625rem;
}
.\[\&\>svg\]\:w-3>svg {
  width: 0.75rem;
}
.\[\&\>svg\]\:shrink-0>svg {
  flex-shrink: 0;
}
.\[\&\>svg\]\:text-destructive>svg {
  color: hsl(var(--destructive));
}
.\[\&\>svg\]\:text-foreground>svg {
  color: hsl(var(--foreground));
}
.\[\&\>svg\]\:text-muted-foreground>svg {
  color: hsl(var(--muted-foreground));
}
.\[\&\>svg\]\:text-sidebar-accent-foreground>svg {
  color: hsl(var(--sidebar-accent-foreground));
}
.\[\&\>svg\~\*\]\:pl-7>svg~* {
  padding-left: 1.75rem;
}
.\[\&\>tr\]\:last\:border-b-0:last-child>tr {
  border-bottom-width: 0px;
}
.\[\&\[data-panel-group-direction\=vertical\]\>div\]\:rotate-90[data-panel-group-direction=vertical]>div {
  --tw-rotate: 90deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.\[\&\[data-state\=open\]\>svg\]\:rotate-180[data-state=open]>svg {
  --tw-rotate: 180deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.\[\&_\.recharts-cartesian-axis-tick_text\]\:fill-muted-foreground .recharts-cartesian-axis-tick text {
  fill: hsl(var(--muted-foreground));
}
.\[\&_\.recharts-cartesian-grid_line\[stroke\=\'\#ccc\'\]\]\:stroke-border\/50 .recharts-cartesian-grid line[stroke='#ccc'] {
  stroke: hsl(var(--border) / 0.5);
}
.\[\&_\.recharts-curve\.recharts-tooltip-cursor\]\:stroke-border .recharts-curve.recharts-tooltip-cursor {
  stroke: hsl(var(--border));
}
.\[\&_\.recharts-dot\[stroke\=\'\#fff\'\]\]\:stroke-transparent .recharts-dot[stroke='#fff'] {
  stroke: transparent;
}
.\[\&_\.recharts-layer\]\:outline-none .recharts-layer {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.\[\&_\.recharts-polar-grid_\[stroke\=\'\#ccc\'\]\]\:stroke-border .recharts-polar-grid [stroke='#ccc'] {
  stroke: hsl(var(--border));
}
.\[\&_\.recharts-radial-bar-background-sector\]\:fill-muted .recharts-radial-bar-background-sector {
  fill: hsl(var(--muted));
}
.\[\&_\.recharts-rectangle\.recharts-tooltip-cursor\]\:fill-muted .recharts-rectangle.recharts-tooltip-cursor {
  fill: hsl(var(--muted));
}
.\[\&_\.recharts-reference-line_\[stroke\=\'\#ccc\'\]\]\:stroke-border .recharts-reference-line [stroke='#ccc'] {
  stroke: hsl(var(--border));
}
.\[\&_\.recharts-sector\[stroke\=\'\#fff\'\]\]\:stroke-transparent .recharts-sector[stroke='#fff'] {
  stroke: transparent;
}
.\[\&_\.recharts-sector\]\:outline-none .recharts-sector {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.\[\&_\.recharts-surface\]\:outline-none .recharts-surface {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.\[\&_\[cmdk-group-heading\]\]\:px-2 [cmdk-group-heading] {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.\[\&_\[cmdk-group-heading\]\]\:py-1\.5 [cmdk-group-heading] {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
.\[\&_\[cmdk-group-heading\]\]\:text-xs [cmdk-group-heading] {
  font-size: 0.75rem;
  line-height: 1rem;
}
.\[\&_\[cmdk-group-heading\]\]\:font-medium [cmdk-group-heading] {
  font-weight: 500;
}
.\[\&_\[cmdk-group-heading\]\]\:text-muted-foreground [cmdk-group-heading] {
  color: hsl(var(--muted-foreground));
}
.\[\&_\[cmdk-group\]\:not\(\[hidden\]\)_\~\[cmdk-group\]\]\:pt-0 [cmdk-group]:not([hidden]) ~[cmdk-group] {
  padding-top: 0px;
}
.\[\&_\[cmdk-group\]\]\:px-2 [cmdk-group] {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.\[\&_\[cmdk-input-wrapper\]_svg\]\:h-5 [cmdk-input-wrapper] svg {
  height: 1.25rem;
}
.\[\&_\[cmdk-input-wrapper\]_svg\]\:w-5 [cmdk-input-wrapper] svg {
  width: 1.25rem;
}
.\[\&_\[cmdk-input\]\]\:h-12 [cmdk-input] {
  height: 3rem;
}
.\[\&_\[cmdk-item\]\]\:px-2 [cmdk-item] {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.\[\&_\[cmdk-item\]\]\:py-3 [cmdk-item] {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.\[\&_\[cmdk-item\]_svg\]\:h-5 [cmdk-item] svg {
  height: 1.25rem;
}
.\[\&_\[cmdk-item\]_svg\]\:w-5 [cmdk-item] svg {
  width: 1.25rem;
}
.\[\&_p\]\:leading-relaxed p {
  line-height: 1.625;
}
.\[\&_svg\]\:pointer-events-none svg {
  pointer-events: none;
}
.\[\&_svg\]\:size-4 svg {
  width: 1rem;
  height: 1rem;
}
.\[\&_svg\]\:shrink-0 svg {
  flex-shrink: 0;
}
.\[\&_tr\:last-child\]\:border-0 tr:last-child {
  border-width: 0px;
}
.\[\&_tr\]\:border-b tr {
  border-bottom-width: 1px;
}
[data-side=left][data-collapsible=offcanvas] .\[\[data-side\=left\]\[data-collapsible\=offcanvas\]_\&\]\:-right-2 {
  right: -0.5rem;
}
[data-side=left][data-state=collapsed] .\[\[data-side\=left\]\[data-state\=collapsed\]_\&\]\:cursor-e-resize {
  cursor: e-resize;
}
[data-side=left] .\[\[data-side\=left\]_\&\]\:cursor-w-resize {
  cursor: w-resize;
}
[data-side=right][data-collapsible=offcanvas] .\[\[data-side\=right\]\[data-collapsible\=offcanvas\]_\&\]\:-left-2 {
  left: -0.5rem;
}
[data-side=right][data-state=collapsed] .\[\[data-side\=right\]\[data-state\=collapsed\]_\&\]\:cursor-w-resize {
  cursor: w-resize;
}
[data-side=right] .\[\[data-side\=right\]_\&\]\:cursor-e-resize {
  cursor: e-resize;
}
</style></head>

  <body>
    <div id="root"><section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text" aria-atomic="false"></section><div class="min-h-screen flex bg-background"><a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-semibold focus:shadow-lg">Skip to main content</a><aside aria-label="Main navigation" class="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30"><div class="p-5 shrink-0"><div class="flex items-center gap-2.5"><div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-4 h-4 text-primary-foreground" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></div><span class="font-heading font-bold text-sidebar-foreground text-sm tracking-tight">DriveMy</span></div></div><nav aria-label="Primary" class="flex-1 px-3 space-y-1 overflow-y-auto"><a aria-label="Home" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard w-5 h-5 shrink-0" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg><span class="text-sm leading-tight">Home</span></a><a aria-label="Learn" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/theory"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open w-5 h-5 shrink-0" aria-hidden="true"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg><span class="text-sm leading-tight">Learn</span></a><a aria-label="Practice" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 bg-sidebar-accent/5 text-sidebar-primary font-semibold" href="/quizzes" aria-current="page"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target w-5 h-5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg><span class="text-sm leading-tight">Practice</span></a><a aria-label="Simulations" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/simulations"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-5 h-5 shrink-0" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg><span class="text-sm leading-tight">Simulations</span></a><a aria-label="Progress" class="nav-item px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10" href="/progress"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column w-5 h-5 shrink-0" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg><span class="text-sm leading-tight">Progress</span></a></nav><div class="px-4 py-2 flex items-center gap-2 border-t border-sidebar-border"><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>EN</button><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs" aria-label="Theme: Light"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg> Light</button></div><div class="p-4 border-t border-sidebar-border"><div class="flex items-center gap-3 mb-3" aria-label="Signed in as Local Developer"><div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0" aria-hidden="true">L</div><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-sidebar-foreground truncate">Local Developer</p><p class="text-xs text-sidebar-foreground/50 truncate">dev@drivemaster.local</p></div></div><button class="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 h-9 rounded-md px-3 w-full justify-start text-sidebar-foreground/60 hover:text-destructive min-h-[48px]" aria-label="Sign out of your account"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out w-4 h-4 mr-2" aria-hidden="true"><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path></svg>Sign Out</button></div></aside><div class="flex-1 flex flex-col min-w-0 md:ml-60"><header role="banner" class="md:hidden flex items-center justify-between px-4 border-b bg-card sticky top-0 z-40" style="height: 56px;"><a class="flex items-center gap-2 rounded-md" aria-label="DriveMy — go to Home" href="/"><div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-4 h-4 text-primary-foreground" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></div><span class="font-heading font-bold text-sm">DriveMy</span></a><div class="flex items-center gap-1"><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs" aria-label="Theme: Light"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg> Light</button><button class="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent/50 hover:text-accent-foreground h-9 rounded-md px-3 gap-1.5 text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>EN</button><div class="relative ml-1"><button aria-label="Profile for Local Developer — toggle menu" aria-expanded="false" aria-haspopup="menu" class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">L</button></div></div></header><main id="main-content" class="flex-1 overflow-auto pb-20 md:pb-0" tabindex="-1" aria-label="Page content"><div class="min-h-[calc(100vh-4rem)] bg-muted/30"><div class="sticky top-0 z-50 border-b bg-card shadow-sm"><div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4 flex-wrap"><div class="flex items-center gap-2"><span class="material-symbols-outlined select-none text-xl text-accent" aria-hidden="true">directions_car</span><span class="font-heading font-bold tracking-tight">DriveMy</span></div><div class="flex-1 max-w-sm hidden md:block px-4"><div class="h-1.5 w-full bg-muted overflow-hidden rounded-full"><div class="h-full transition-all duration-500 bg-accent" style="width: 0%;"></div></div><div class="text-[10px] text-muted-foreground mt-1 font-medium tracking-wide">Q1 OF 10</div></div><div class="ml-auto flex items-center gap-3 flex-wrap"><button class="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95 hover:shadow-md bg-accent text-accent-foreground">FINISH QUIZ</button></div></div></div><div class="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"><div class="bg-card border rounded-2xl shadow-sm overflow-hidden"><div class="p-5 md:p-7"><div class="flex items-start justify-between mb-3"><div><div class="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-accent/15 text-accent">Practice Quiz</div></div><div class="font-heading font-black text-4xl md:text-5xl tabular-nums leading-none text-accent/40">001</div></div><h2 class="font-heading font-bold text-lg md:text-xl leading-snug">Who can use a signed cycle track accompanied by a continuous white line on the left-hand side?</h2><p class="text-sm text-muted-foreground italic mt-2">Who can use a signed cycle track accompanied by a continuous white line on the left-hand side? (Translation Unavailable)</p><div class="mt-5 space-y-2.5"><button class="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all min-h-[56px] active:scale-[0.99] hover:border-foreground/30 border-border"><span class="shrink-0 w-10 h-10 rounded-lg grid place-items-center font-heading font-bold text-sm transition-colors bg-muted text-foreground/70">A</span><div class="flex-1 pt-1"><div class="text-sm font-medium text-foreground">You may drive in it to overtake a vehicle turning right.</div><div class="text-xs text-muted-foreground italic mt-0.5">You may drive in it to overtake a vehicle turning right.</div></div></button><button class="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all min-h-[56px] active:scale-[0.99] hover:border-foreground/30 border-border"><span class="shrink-0 w-10 h-10 rounded-lg grid place-items-center font-heading font-bold text-sm transition-colors bg-muted text-foreground/70">B</span><div class="flex-1 pt-1"><div class="text-sm font-medium text-foreground">You may drive in it provided you are not towing a trailer.</div><div class="text-xs text-muted-foreground italic mt-0.5">You may drive in it provided you are not towing a trailer.</div></div></button><button class="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all min-h-[56px] active:scale-[0.99] hover:border-foreground/30 border-border"><span class="shrink-0 w-10 h-10 rounded-lg grid place-items-center font-heading font-bold text-sm transition-colors bg-muted text-foreground/70">C</span><div class="flex-1 pt-1"><div class="text-sm font-medium text-foreground">Cyclists and users of motorised wheelchairs.</div><div class="text-xs text-muted-foreground italic mt-0.5">Cyclists and users of motorised wheelchairs.</div></div></button><button class="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all min-h-[56px] active:scale-[0.99] hover:border-foreground/30 border-border"><span class="shrink-0 w-10 h-10 rounded-lg grid place-items-center font-heading font-bold text-sm transition-colors bg-muted text-foreground/70">D</span><div class="flex-1 pt-1"><div class="text-sm font-medium text-foreground">You may drive in it provided it is not being used by a cyclist.</div><div class="text-xs text-muted-foreground italic mt-0.5">You may drive in it provided it is not being used by a cyclist.</div></div></button></div></div><div class="border-t bg-muted/20 px-5 md:px-7 py-3 flex items-center justify-between gap-2 flex-wrap"><button disabled="" class="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 transition-all"><span class="material-symbols-outlined select-none text-lg" aria-hidden="true">arrow_back</span> PREVIOUS</button><div class="flex items-center gap-2"><button disabled="" class="text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 transition-all hover:shadow-md hover:brightness-95 active:scale-95 bg-accent text-accent-foreground">CONFIRM</button><button class="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-95 active:scale-95 hover:shadow-md bg-accent text-accent-foreground">NEXT <span class="material-symbols-outlined select-none text-lg" aria-hidden="true">arrow_forward</span></button></div></div></div><aside class="space-y-4"><div class="bg-card border rounded-2xl p-5 shadow-sm"><div class="flex items-center justify-between mb-3"><h3 class="font-heading font-bold text-sm">Quiz Progress</h3><span class="text-xs font-semibold text-accent">0/10 Complete</span></div><div class="flex justify-center my-3"><div class="relative w-28 h-28"><svg viewBox="0 0 36 36" class="w-full h-full -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" class="stroke-muted" stroke-width="3"></circle><circle cx="18" cy="18" r="15.9" fill="none" class="stroke-accent" stroke-width="3" stroke-dasharray="0, 100" stroke-linecap="round"></circle></svg><div class="absolute inset-0 grid place-items-center"><span class="font-heading font-black text-2xl">0%</span></div></div></div><div class="grid grid-cols-2 gap-2"><div class="rounded-lg bg-muted/40 p-3 text-center"><div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Answered</div><div class="font-heading font-bold text-lg">0</div></div><div class="rounded-lg bg-muted/40 p-3 text-center"><div class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</div><div class="font-heading font-bold text-lg">10</div></div></div></div><div class="bg-card border rounded-2xl p-5 shadow-sm"><h3 class="font-heading font-bold text-sm mb-3">Question Navigation</h3><div class="grid gap-1.5 grid-cols-5"><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-accent text-primary-foreground border-transparent ring-2 ring-offset-1 ring-accent/50">1</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">2</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">3</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">4</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">5</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">6</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">7</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">8</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">9</button><button class="aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border bg-muted/40 text-muted-foreground border-border hover:bg-muted">10</button></div><div class="mt-4 space-y-1.5 text-[11px]"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-foreground/90"></span>Answered</div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-muted border"></span>Not Answered</div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-warning/30 border border-warning/40"></span>Flagged for Review</div></div></div><div class="rounded-2xl p-5 bg-accent/10 border border-accent/30"><div class="flex items-center gap-2 mb-1"><span class="material-symbols-outlined select-none text-base text-accent" aria-hidden="true">lightbulb</span><h4 class="font-heading font-bold text-sm">Practice Tip</h4></div><p class="text-xs text-muted-foreground leading-relaxed">You'll see the correct answer and explanation after each question. No timer — focus on learning.</p></div></aside></div></div></main><footer class="hidden md:block border-t p-4 text-center text-xs text-muted-foreground">Final Year Project – INFO 4401 (Semester 2 2025/2026) by Ahmad Faiz &amp; Ahmad Adam Danial</footer></div><nav aria-label="Mobile navigation" class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex items-stretch pb-safe" style="min-height: 64px;"><a aria-label="Home" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard w-5 h-5 transition-transform" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Home</span></a><a aria-label="Learn" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/theory"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open w-5 h-5 transition-transform" aria-hidden="true"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Learn</span></a><a aria-label="Practice" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-primary" href="/quizzes" aria-current="page"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all bg-primary/10 scale-105" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target w-5 h-5 transition-transform scale-110" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-primary">Practice</span></a><a aria-label="Simulations" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/simulations"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car w-5 h-5 transition-transform" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Simulations</span></a><a aria-label="Progress" class="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[48px] text-muted-foreground hover:text-foreground" href="/progress"><span class="flex items-center justify-center w-10 h-7 rounded-full transition-all " aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column w-5 h-5 transition-transform" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg></span><span class="text-[10px] font-semibold leading-none tracking-wide text-muted-foreground">Progress</span></a></nav></div></div>
    <script type="module" src="/src/main.tsx"></script>
  

</body></html>