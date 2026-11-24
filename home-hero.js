(() => {
  const section=document.querySelector('[data-hero-sequence]');
  if(!section)return;
  const video=section.querySelector('[data-hero-video]');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const mobile=matchMedia('(max-width:760px)');
  let frame=0;
  let primed=false;
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
    // Safari met les recherches en file d'attente : on attend la fin de la précédente
    // pour toujours afficher la position de scroll la plus récente, sans retard.
    if(video.seeking)return;
    const time=Math.min(video.duration-0.001,progress()*video.duration);
    if(Math.abs(video.currentTime-time)>1/60)video.currentTime=time;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(render);}
  // Safari iOS n'affiche pas les images d'une vidéo qui n'a jamais été lue :
  // une lecture immédiatement mise en pause débloque l'affichage au scroll.
  function prime(){
    if(primed||reduced.matches)return;
    primed=true;
    const attempt=video.play();
    if(attempt&&attempt.then)attempt.then(()=>{video.pause();schedule();}).catch(()=>{primed=false;});
    else{video.pause();schedule();}
  }
  function source(){
    video.pause();
    if(reduced.matches){video.hidden=true;return;}
    video.hidden=false;
    const url=mobile.matches?'public/home-animation-mobile-scroll.mp4':'public/home-animation-desktop.mp4';
    if(video.getAttribute('src')!==url){
      video.classList.remove('is-ready');
      primed=false;
      video.preload='auto';
      video.src=url;
      video.load();
    }
    schedule();
  }
  video.addEventListener('loadedmetadata',schedule);
  video.addEventListener('loadeddata',prime);
  video.addEventListener('canplay',()=>{video.classList.add('is-ready');prime();schedule();});
  video.addEventListener('seeked',()=>{video.classList.add('is-ready');schedule();});
  video.addEventListener('error',()=>{video.hidden=true;});
  addEventListener('touchstart',prime,{passive:true,once:true});
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  mobile.addEventListener('change',source);reduced.addEventListener('change',source);
  addEventListener('pageshow',source);
  source();
})();
