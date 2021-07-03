/* exported notyf */
const notyf = new Notyf({
  duration: 2000,
  position: {
    x: 'right',
    y: 'top',
  },
  types: [
    {
      type: 'success',
      background: 'green',
      className: 'notyf__toast--success',

      dismissible: true,
      icon: false,
    },
    {
      type: 'warning',
      background: 'orange',
      className: 'notyf__toast--warning',
      dismissible: true,
      icon: false,
    },
    {
      type: 'error',
      background: 'indianred',
      className: 'notyf__toast--error',
      dismissible: true,
      icon: false,
    },
    {
      type: 'info',
      background: '#2196f3',
      className: 'notyf__toast--info',
      dismissible: true,
      icon: false,
    },
  ],
});

window.notyf = notyf;
