(() => {
  const section=document.querySelector('[data-hero-sequence]');
  if(!section)return;
  const video=section.querySelector('[data-hero-video]');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const mobile=matchMedia('(max-width:760px)');
  let frame=0;
  section.classList.add('is-ready');
  video.muted=true;
  video.loop=false;
  video.pause();
  function progress(){
    const top=section.getBoundingClientRect().top+scrollY;
    const distance=Math.max(1,section.offsetHeight-innerHeight);
    return Math.min(1,Math.max(0,(scrollY-top)/distance));
  }
  function render(){
    frame=0;
    if(reduced.matches||!Number.isFinite(video.duration)||video.duration<=0)return;
    const time=progress()*video.duration;
    if(Math.abs(video.currentTime-time)>0.025)video.currentTime=time;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(render);}
  function source(){
    video.pause();
    if(reduced.matches){video.hidden=true;return;}
    video.hidden=false;
    const url=mobile.matches?'public/home-animation-mobile.mp4':'public/home-animation-desktop.mp4';
    if(video.getAttribute('src')!==url){
      video.classList.remove('is-ready');
      video.src=url;
      video.load();
    }
    schedule();
  }
  video.addEventListener('loadedmetadata',schedule);
  video.addEventListener('canplay',()=>{video.classList.add('is-ready');schedule();});
  video.addEventListener('seeked',()=>video.classList.add('is-ready'));
  video.addEventListener('error',()=>{video.hidden=true;});
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  mobile.addEventListener('change',source);reduced.addEventListener('change',source);
  addEventListener('pageshow',source);
  source();
})();
