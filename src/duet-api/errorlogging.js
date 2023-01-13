
import toastr from 'toastr';
import 'toastr/build/toastr.css';

toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: false,
  progressBar: false,
  positionClass: 'toast-top-center',
  preventDuplicates: false,
  showDuration: '5000',
  hideDuration: '1000',
  tapToDismiss: true,
  timeOut: '5000',
  extendedTimeOut: '7500',
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut',
};

export class DuetError {
  constructor() {
    this.errorList = [];
    this.clientId = 'VCS-viewing-client';
    this.info = {};
  }

  /**
   * @param {Object} object - object to be placed in errorList / or to be sent to error service
   * @param {number} loglevel - level of error (1=info; 2=warning; 3=error)
   */
  addError(object, loglevel) {
    // loadSettings();
    if (loglevel === 3) toastr.error(`Error :${ JSON.stringify(object)}`);
    if (loglevel === 2) toastr.warning(`Warning :${ JSON.stringify(object)}`);
    if (loglevel === 1) toastr.info(`Info :${ JSON.stringify(object)}`);
    this.errorList.push({ time: new Date().toISOString(), level: loglevel, msg: JSON.stringify(object) });
    // errors could be published from here to an error logging endpoint such as duet-error
    this.errorList = [...new Map(this.errorList.map(item => [item.msg, item])).values()];
  }

  /**
   * @returns {Array} the list of errors logged until request
   */
  getAllErrors() {
    return this.errorList;
  }
}

const dueterror = new DuetError();
export default dueterror;
