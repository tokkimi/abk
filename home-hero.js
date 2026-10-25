(() => {
  const section=document.querySelector('[data-hero-sequence]');
  if(!section)return;
  const hero=section.querySelector('[data-hero-pin]');
  const display=section.querySelector('[data-hero-frame]');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const mobileLayout=matchMedia('(max-width:760px)');
  const mobile=mobileLayout.matches;
  const directory=`public/home-frames/${mobile?'mobile/':''}`;
  const cache=new Map();
  let target=0,shown=-1,scheduled=false;
  let progressMobile=0,pin=null,lastScroll=scrollY;
  const mobileTravel=800;
  const source=index=>`${directory}frame_${String(index+1).padStart(3,'0')}.webp`;
  section.classList.add('is-initializing');
  function ready(){section.classList.remove('is-initializing');section.classList.add('is-ready');}
  if(display.complete&&display.naturalWidth)ready();
  else{display.addEventListener('load',ready,{once:true});display.addEventListener('error',ready,{once:true});}
  // Text remains accessible even if a slow image connection fails.
  setTimeout(ready,1800);
  function paint(){
    const frame=cache.get(target);
    if(!frame?.ready||shown===target)return;
    display.parentElement.querySelector('source')?.removeAttribute('srcset');
    display.removeAttribute('srcset');display.src=frame.src;
    display.dataset.frame=String(target+1);shown=target;ready();
  }
  function load(index){
    if(cache.has(index))return cache.get(index).promise;
    const image=new Image();const frame={src:source(index),ready:false,promise:null};cache.set(index,frame);
    frame.promise=new Promise(resolve=>{
      image.onload=async()=>{try{await image.decode();}catch(_){}frame.ready=true;paint();image.onload=null;image.onerror=null;resolve();};
      image.onerror=()=>{image.onload=null;image.onerror=null;resolve();};image.src=frame.src;
    });
    return frame.promise;
  }
  function update(){
    scheduled=false;
    const travel=Math.max(1,section.offsetHeight-hero.offsetHeight);
    let progress=Math.max(0,Math.min(1,-section.getBoundingClientRect().top/travel));
    if(mobileLayout.matches&&!reduced){
      const anchor=mobileAnchor(),position=scrollY;
      if(!pin){
        const forward=lastScroll<anchor&&position>=anchor&&position<anchor+innerHeight&&progressMobile<1;
        const backward=lastScroll>anchor&&position<=anchor&&position>anchor-innerHeight&&progressMobile>0;
        if((forward||backward)&&!document.querySelector('dialog[open]'))pinPage(anchor);
        else if(position>anchor+3)progressMobile=1;
        else if(position<anchor-3)progressMobile=0;
        lastScroll=position;
      }
      progress=progressMobile;
    }
    target=reduced?49:Math.min(49,Math.floor(progress*50));
    load(target);paint();
    // Nearby frames get priority if the visitor scrolls ahead of the preload.
    if(!reduced){if(target<49)load(target+1);if(target>0)load(target-1);}
  }
  function request(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  function mobileAnchor(){return pin?pin.anchor:Math.max(0,scrollY+section.getBoundingClientRect().top);}
  function pinPage(anchor){
    if(pin)return;
    pin={anchor,style:document.body.getAttribute('style'),behavior:document.documentElement.style.scrollBehavior,overscroll:document.documentElement.style.overscrollBehavior};
    document.documentElement.style.scrollBehavior='auto';
    document.documentElement.style.overscrollBehavior='none';
    Object.assign(document.body.style,{position:'fixed',top:`${-anchor}px`,left:'0',right:'0',width:'100%',overflow:'hidden'});
    section.dataset.pinned='true';
  }
  function releasePage(position){
    if(!pin)return;
    const previous=pin;pin=null;
    if(previous.style===null)document.body.removeAttribute('style');else document.body.setAttribute('style',previous.style);
    section.dataset.pinned='false';lastScroll=Math.max(0,position);scrollTo(0,lastScroll);
    document.documentElement.style.scrollBehavior=previous.behavior;
    document.documentElement.style.overscrollBehavior=previous.overscroll;
  }
  function advance(delta){
    const anchor=pin.anchor,next=progressMobile+delta/mobileTravel;
    progressMobile=Math.max(0,Math.min(1,next));
    request();
    if(delta>0&&progressMobile===1){
      // Do not release the hero before the final image is actually available.
      load(49).then(()=>{if(pin&&progressMobile===1){paint();releasePage(anchor+1);}});
    }else if(delta<0&&progressMobile===0)releasePage(anchor-1);
  }
  function consume(delta,event){
    if(!mobileLayout.matches||reduced||!delta||document.querySelector('dialog[open]'))return;
    if(pin){if(event.cancelable)event.preventDefault();advance(delta);return;}
    const anchor=mobileAnchor(),position=scrollY;
    const crossing=delta>0?position<anchor&&position+delta>=anchor:position>anchor&&position+delta<=anchor;
    if((Math.abs(position-anchor)<3||crossing)&&(delta>0?progressMobile<1:progressMobile>0)){
      if(event.cancelable)event.preventDefault();pinPage(anchor);advance(delta-(anchor-position));
    }
  }
  let touchX=0,touchY=0;
  addEventListener('touchstart',event=>{if(event.touches.length===1){touchX=event.touches[0].clientX;touchY=event.touches[0].clientY;}},{passive:true});
  addEventListener('touchmove',event=>{
    if(event.touches.length!==1)return;
    const point=event.touches[0],dx=touchX-point.clientX,dy=touchY-point.clientY;
    touchX=point.clientX;touchY=point.clientY;
    if(Math.abs(dy)>Math.abs(dx)*1.2)consume(dy,event);
  },{passive:false});
  addEventListener('wheel',event=>consume(event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1),event),{passive:false});
  addEventListener('keydown',event=>{
    if(event.key==='Escape'&&pin){progressMobile=1;releasePage(pin.anchor+1);request();return;}
    if(event.target.closest?.('input,select,textarea,button,a,[contenteditable]'))return;
    const deltas={ArrowDown:40,ArrowUp:-40,PageDown:innerHeight*.8,PageUp:-innerHeight*.8,' ':innerHeight*.8};
    if(event.key in deltas)consume(deltas[event.key],event);
  });
  // Navigation and quote dialogs must never inherit a locked document.
  section.addEventListener('click',event=>{if(pin&&event.target.closest('a,button')){progressMobile=1;releasePage(pin.anchor+1);request();}});
  load(0);load(49);
  let next=1;
  async function preload(){while(next<49)await load(next++);}
  if(!reduced)for(let worker=0;worker<3;worker++)preload();
  addEventListener('scroll',request,{passive:true});
  let layoutWidth=innerWidth;
  addEventListener('resize',()=>{if(pin&&innerWidth!==layoutWidth)releasePage(pin.anchor);layoutWidth=innerWidth;request();});
  addEventListener('pagehide',()=>{if(pin)releasePage(pin.anchor);});
  addEventListener('pageshow',request);
  request();
})();
