(() => {
  const section=document.querySelector('[data-hero-sequence]');
  if(!section)return;
  const video=section.querySelector('[data-hero-video]');
  const toggle=section.querySelector('[data-hero-toggle]');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const mobile=matchMedia('(max-width:760px)');
  let visible=true;
  section.classList.add('is-ready');
  video.muted=true;
  video.loop=false;
  function labels(){
    const playing=!video.paused&&!video.ended;
    toggle.textContent=playing?'Ⅱ':'▶';
    toggle.setAttribute('aria-label',playing?'Mettre en pause l’animation':'Lire l’animation');
    toggle.hidden=false;
  }
  async function play(){
    if(reduced.matches||!visible||document.hidden)return;
    if(video.ended)video.currentTime=0;
    try{await video.play();}catch(_){}
    labels();
  }
  function pause(){
    video.pause();
    labels();
  }
  function source(){
    if(reduced.matches){video.pause();video.hidden=true;toggle.hidden=true;return;}
    video.hidden=false;
    const url=mobile.matches?'public/home-animation-mobile.mp4':'public/home-animation-desktop.mp4';
    if(video.getAttribute('src')!==url){video.src=url;video.load();}
    labels();
  }
  video.addEventListener('playing',()=>{video.classList.add('is-playing');labels();});
  video.addEventListener('pause',()=>{video.classList.remove('is-playing');labels();});
  video.addEventListener('ended',()=>{video.classList.remove('is-playing');labels();});
  video.addEventListener('error',()=>{video.hidden=true;toggle.hidden=true;});
  toggle.addEventListener('click',()=>{video.paused||video.ended?play():pause();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)pause();},{threshold:.05}).observe(section);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  mobile.addEventListener('change',source);reduced.addEventListener('change',source);
  addEventListener('pageshow',source);
  source();
})();
