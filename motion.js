const mobile=matchMedia('(max-width:760px)').matches;
const reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
if(!mobile){document.querySelectorAll('main section:not([data-hero-pin]),.service-card').forEach(node=>node.classList.add('reveal'));const observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting)target.classList.add('visible')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(n=>observer.observe(n));}
document.querySelectorAll('[data-coverflow]').forEach(flow=>{
  let current=0,startX=0,startY=0,suppressClickUntil=0;
  const cards=[...flow.querySelectorAll('.service-card')],total=cards.length;
  const draw=()=>{flow.dataset.index=current;flow.querySelector('[data-current]').textContent=`0${current+1}`;cards.forEach((card,index)=>{const offset=(index-current+total)%total;card.dataset.position=offset===0?'center':offset===1?'right':'left';});};
  const move=delta=>{current=(current+delta+total)%total;draw();};
  flow.querySelector('[data-next]').onclick=()=>move(1);flow.querySelector('[data-prev]').onclick=()=>move(-1);
  if(!reduceMotion)setInterval(()=>{if(!flow.matches(':hover')&&!document.hidden)move(1);},5000);
  flow.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY;});
  flow.addEventListener('pointerup',e=>{if(!matchMedia('(max-width:760px)').matches)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClickUntil=Date.now()+400;move(dx<0?1:-1);}});
  flow.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopPropagation();}},true);
  draw();
});
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav nav');
if(menu)menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));
const orb=document.querySelector('.contact-orb');if(orb){let dragged=false,startX,startY,startLeft,startTop;orb.addEventListener('pointerdown',e=>{dragged=false;startX=e.clientX;startY=e.clientY;const r=orb.getBoundingClientRect();startLeft=r.left;startTop=r.top;orb.setPointerCapture(e.pointerId)});orb.addEventListener('pointermove',e=>{if(!orb.hasPointerCapture(e.pointerId))return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.hypot(dx,dy)>5)dragged=true;if(!dragged)return;const size=orb.offsetWidth;orb.style.left=`${Math.min(Math.max(10,startLeft+dx),innerWidth-size-10)}px`;orb.style.top=`${Math.min(Math.max(10,startTop+dy),innerHeight-size-10)}px`;orb.style.right='auto';orb.style.bottom='auto'});orb.addEventListener('pointerup',e=>{if(dragged){e.preventDefault();orb.releasePointerCapture(e.pointerId)}});orb.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopImmediatePropagation();dragged=false}},true)}
