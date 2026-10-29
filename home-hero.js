(() => {
  const section=document.querySelector('[data-hero-sequence]');
  if(!section)return;
  const video=section.querySelector('[data-hero-video]');
  const toggle=section.querySelector('[data-hero-toggle]');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const mobile=matchMedia('(max-width:760px)');
  let visible=true,userPaused=false;
  section.classList.add('is-ready');
  video.muted=true;
  function labels(){toggle.textContent=userPaused?'▶':'Ⅱ';toggle.setAttribute('aria-label',userPaused?'Lire l’animation':'Mettre en pause l’animation');}
  async function resume(){
    if(reduced.matches||userPaused||!visible||document.hidden){video.pause();return;}
    try{await video.play();toggle.hidden=false;}catch(_){toggle.hidden=false;userPaused=true;labels();}
  }
  function source(){
    if(reduced.matches){video.pause();video.hidden=true;toggle.hidden=true;return;}
    video.hidden=false;
    const url=mobile.matches?'public/home-animation-mobile.mp4':'public/home-animation-desktop.mp4';
    if(video.getAttribute('src')!==url){video.src=url;video.load();}
    resume();
  }
  video.addEventListener('playing',()=>{video.classList.add('is-playing');toggle.hidden=false;});
  video.addEventListener('error',()=>{video.hidden=true;toggle.hidden=true;});
  toggle.addEventListener('click',()=>{userPaused=!userPaused;labels();resume();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{threshold:.05}).observe(section);
  document.addEventListener('visibilitychange',resume);
  mobile.addEventListener('change',source);reduced.addEventListener('change',source);
  addEventListener('pageshow',resume);
  source();
})();
