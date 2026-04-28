import{r as A}from"./rolldown-runtime-Bnw7wDfq.js";import{M as q}from"./vendor-BpO4XCYx.js";import{Gn as G,Mt as H}from"./vendor-react-D-QFj0h5.js";var d=A(q(),1),n=G(),O=(e,i,t=!0)=>{(0,d.useEffect)(()=>{if(!e||!i||!t)return;const r=a=>{(!e.ctrl||a.metaKey||a.ctrlKey)&&(!e.alt||a.altKey)&&(!e.shift||a.shiftKey)&&a.key.toLowerCase()===e.key.toLowerCase()&&(a.preventDefault(),i(a))};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[e,i,t])},v=({shortcut:e,variant:i="default",position:t="inline"})=>{if(!e)return null;const r=[];e.ctrl&&r.push({key:"⌘",label:"Cmd"}),e.alt&&r.push({key:"⌥",label:"Opt"}),e.shift&&r.push({key:"⇧",label:"Shift"});let a={key:e.key,label:e.key};const l={" ":{key:"␣",label:"Space"},Enter:{key:"↵",label:"Enter"},Escape:{key:"⎋",label:"Esc"},Delete:{key:"⌫",label:"Del"},Backspace:{key:"⌫",label:"Bksp"},ArrowUp:{key:"↑",label:"Up"},ArrowDown:{key:"↓",label:"Down"},ArrowLeft:{key:"←",label:"Left"},ArrowRight:{key:"→",label:"Right"},Tab:{key:"⇥",label:"Tab"},CapsLock:{key:"⇪",label:"Caps"}};return l[e.key]?a=l[e.key]:a={key:e.key.length===1?e.key.toUpperCase():e.key,label:e.key.length===1?e.key.toUpperCase():e.key},r.push(a),(0,n.jsx)("span",{className:`
        ml-2 text-xs font-mono tracking-tight
        ${{default:"opacity-70",subtle:"opacity-50",prominent:"opacity-100 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded"}[i]}
        ${{inline:"",corner:"absolute -top-1 -right-1 bg-gray-800 text-white dark:bg-black px-1.5 py-0.5 rounded-full text-[10px]"}[t]}
      `,"aria-hidden":"true",children:t==="corner"?r.slice(0,3).map(g=>g.key).join("")+(r.length>3?"…":""):r.map(g=>g.key).join("")})},W=({children:e,content:i,position:t="top"})=>{const[r,a]=d.useState(!1),l=(0,d.useRef)(),g=()=>{l.current=setTimeout(()=>a(!0),300)},p=()=>{clearTimeout(l.current),a(!1)};return(0,n.jsxs)("div",{className:"relative inline-flex",onMouseEnter:g,onMouseLeave:p,children:[e,r&&i&&(0,n.jsxs)("div",{className:`
            absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-black 
            rounded shadow-lg whitespace-nowrap pointer-events-none
            ${{top:"bottom-full left-1/2 -translate-x-1/2 mb-2",bottom:"top-full left-1/2 -translate-x-1/2 mt-2",left:"right-full top-1/2 -translate-y-1/2 mr-2",right:"left-full top-1/2 -translate-y-1/2 ml-2"}[t]}
          `,role:"tooltip",children:[i,(0,n.jsx)("div",{className:"absolute w-2 h-2 bg-gray-900 dark:bg-black transform rotate-45 -z-10"})]})]})},X=()=>(0,d.useCallback)(e=>{const i=e.currentTarget,t=document.createElement("span"),r=Math.max(i.clientWidth,i.clientHeight),a=r/2,l=i.getBoundingClientRect();t.style.width=t.style.height=`${r}px`,t.style.left=`${e.clientX-l.left-a}px`,t.style.top=`${e.clientY-l.top-a}px`,t.className="absolute bg-white opacity-30 rounded-full pointer-events-none animate-ripple";const g=i.querySelector(".ripple");g&&g.remove(),t.classList.add("ripple"),i.appendChild(t),setTimeout(()=>t.remove(),600)},[]),Y=d.memo((0,d.forwardRef)(({children:e,variant:i="primary",size:t="md",loading:r=!1,disabled:a=!1,onClick:l,type:g="button",fullWidth:p=!1,icon:y,iconPosition:k="left",className:E="",shortcut:s,showShortcut:f=!0,shortcutPosition:c="right",shortcutVariant:m="default",tooltip:x,tooltipPosition:L="top",enableRipple:h=!0,enableShortcut:N=!0,ariaLabel:R,pressed:M,...T},_)=>{const K=(0,d.useRef)(null),S=_||K,w=X();O(s,o=>{!a&&!r&&l&&l(o)},N&&!a&&!r);const B=(0,d.useCallback)(o=>{a||r||(h&&w(o),l?.(o))},[a,r,l,h,w]),D={primary:`
      bg-blue-600 text-white 
      hover:bg-blue-700 active:bg-blue-800
      focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-800
      disabled:bg-blue-400 dark:disabled:bg-blue-800
    `,secondary:`
      bg-gray-200 text-gray-800 
      hover:bg-gray-300 active:bg-gray-400
      focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
      dark:bg-gray-800 dark:text-gray-200 
      dark:hover:bg-gray-700 dark:active:bg-gray-600
      disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400
    `,danger:`
      bg-red-600 text-white 
      hover:bg-red-700 active:bg-red-800
      focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-red-700 dark:hover:bg-red-600 dark:active:bg-red-800
      disabled:bg-red-400 dark:disabled:bg-red-800
    `,success:`
      bg-green-600 text-white 
      hover:bg-green-700 active:bg-green-800
      focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-green-700 dark:hover:bg-green-600 dark:active:bg-green-800
      disabled:bg-green-400 dark:disabled:bg-green-800
    `,warning:`
      bg-yellow-500 text-white 
      hover:bg-yellow-600 active:bg-yellow-700
      focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-yellow-600 dark:hover:bg-yellow-500 dark:active:bg-yellow-700
      disabled:bg-yellow-300 dark:disabled:bg-yellow-800
    `,outline:`
      border-2 border-gray-300 text-gray-700 
      hover:bg-gray-50 active:bg-gray-100
      focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
      dark:border-gray-600 dark:text-gray-300 
      dark:hover:bg-gray-800 dark:active:bg-gray-700
      disabled:border-gray-200 disabled:text-gray-400 dark:disabled:border-gray-700
    `,ghost:`
      text-gray-600 
      hover:bg-gray-100 active:bg-gray-200
      focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
      dark:text-gray-400 
      dark:hover:bg-gray-800 dark:active:bg-gray-700
      disabled:text-gray-300 dark:disabled:text-gray-600
    `,glass:`
      backdrop-blur-sm bg-white/70 text-gray-800
      hover:bg-white/80 active:bg-white/90
      focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2
      border border-white/20
      dark:bg-gray-900/70 dark:text-gray-200
      dark:hover:bg-gray-900/80 dark:active:bg-gray-900/90
    `},U={xs:"px-2 py-1 text-xs gap-1",sm:"px-3 py-1.5 text-sm gap-1.5",md:"px-4 py-2 text-sm gap-2",lg:"px-6 py-3 text-base gap-2.5",xl:"px-8 py-4 text-lg gap-3"},u=o=>({xs:12,sm:14,md:16,lg:18,xl:20})[o]||16,z=()=>{if(x)return x;if(!s||!f)return null;const o=[];s.ctrl&&o.push("⌘"),s.alt&&o.push("⌥"),s.shift&&o.push("⇧");let b=s.key;b===" "?b="Space":b.length===1&&(b=b.toUpperCase()),o.push(b);const $=o.join(" + ");return s.description?`${s.description} (${$})`:$},j=(0,n.jsxs)("button",{ref:S,type:g,onClick:B,disabled:a||r,"aria-label":R,"aria-pressed":M,"aria-busy":r,className:`
        ${D[i]}
        ${U[t]}
        ${E}
        ${p?"w-full flex":"inline-flex"}
        items-center justify-center font-medium rounded-lg
        focus:outline-none focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
        transition-all duration-200 ease-out
        disabled:cursor-not-allowed
        relative overflow-hidden
      `,...T,children:[r&&(0,n.jsx)(H,{size:u(t),className:"animate-spin shrink-0","aria-hidden":"true"}),s&&f&&c==="left"&&(0,n.jsx)(v,{shortcut:s,variant:m,position:"inline"}),y&&!r&&k==="left"&&(0,n.jsx)(y,{size:u(t),className:"shrink-0","aria-hidden":"true"}),(0,n.jsx)("span",{className:"truncate",children:e}),y&&!r&&k==="right"&&(0,n.jsx)(y,{size:u(t),className:"shrink-0","aria-hidden":"true"}),s&&f&&c==="right"&&(0,n.jsx)(v,{shortcut:s,variant:m,position:"inline"}),s&&f&&c==="corner"&&(0,n.jsx)(v,{shortcut:s,variant:"prominent",position:"corner"})]}),C=z();return C?(0,n.jsx)(W,{content:C,position:L,children:j}):j}));Y.displayName="Button";export{Y as t};
