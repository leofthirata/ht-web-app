(self.webpackChunkht_web_app=self.webpackChunkht_web_app||[]).push([[9706],{9706:(e,t,a)=>{"use strict";a.r(t),a.d(t,{createSwipeBackGesture:()=>s});var r=a(2377),n=a(7279);a(960);const s=(e,t,a,s,c)=>{const o=e.ownerDocument.defaultView;return(0,n.createGesture)({el:e,gestureName:"goback-swipe",gesturePriority:40,threshold:10,canStart:e=>e.startX<=50&&t(),onStart:a,onMove:e=>{s(e.deltaX/o.innerWidth)},onEnd:e=>{const t=o.innerWidth,a=e.deltaX/t,n=e.velocityX,s=n>=0&&(n>.2||e.deltaX>t/2),i=(s?1-a:a)*t;let h=0;if(i>5){const e=i/Math.abs(n);h=Math.min(e,540)}c(s,a<=0?.01:(0,r.j)(0,a,.9999),h)}})}}}]);