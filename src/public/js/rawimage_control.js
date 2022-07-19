(() => {
  window.refreshRawImage = () => {
    document.querySelector('#rawimage-loading').classList.add('active');
    document.querySelector('#raw-image').src = document.querySelector('#skinData').data.skin;
    setTimeout(() => {
      document.querySelector('#rawimage-loading').classList.remove('active');
    }, 200);
  };
})();
