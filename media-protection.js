(() => {
 const imageTarget=target=>target.closest('img,.brand svg,.brand');
 document.addEventListener('contextmenu',event=>{if(imageTarget(event.target))event.preventDefault();});
 document.addEventListener('dragstart',event=>{if(imageTarget(event.target))event.preventDefault();});
 document.addEventListener('copy',event=>{if(imageTarget(event.target)&&!window.getSelection()?.toString())event.preventDefault();});
 for(const img of document.images)img.draggable=false;
 for(const reader of document.querySelectorAll('.press-reader')){
  const img=reader.querySelector('img'),lens=document.createElement('span');lens.className='press-lens';lens.setAttribute('aria-hidden','true');reader.append(lens);reader.tabIndex=0;
  function move(event){const rect=reader.getBoundingClientRect(),x=Math.max(0,Math.min(rect.width,event.clientX-rect.left)),y=Math.max(0,Math.min(rect.height,event.clientY-rect.top)),size=lens.offsetWidth||180,zoom=2.8;const left=Math.max(0,Math.min(rect.width-size,x-size/2)),top=Math.max(0,Math.min(rect.height-size,y-size/2));lens.style.left=left+'px';lens.style.top=top+'px';lens.style.backgroundImage=`url("${img.currentSrc||img.src}")`;lens.style.backgroundSize=`${rect.width*zoom}px ${rect.height*zoom}px`;lens.style.backgroundPosition=`${size/2-x*zoom}px ${size/2-y*zoom}px`;}
  reader.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){reader.classList.add('active');move(event);}});
  reader.addEventListener('pointermove',event=>{if(reader.classList.contains('active')){if(event.pointerType!=='mouse')event.preventDefault();move(event);}});
  reader.addEventListener('pointerdown',event=>{reader.classList.add('active');reader.setPointerCapture(event.pointerId);move(event);});
  reader.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')reader.classList.remove('active');});reader.addEventListener('pointerleave',()=>reader.classList.remove('active'));reader.addEventListener('pointercancel',()=>reader.classList.remove('active'));
  reader.addEventListener('focus',()=>{reader.classList.add('active');const rect=reader.getBoundingClientRect();move({clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2});});reader.addEventListener('blur',()=>reader.classList.remove('active'));
 }
})();
