export default class ReadmeController {
  constructor($window, $location) {
    this.window = $window;
    this.location = $location;
    if (window.clientId !== undefined &&
      window.clientBuild !== undefined &&
      window.developerOrg !== undefined &&
      window.product !== undefined &&
      window.developerWebsite !== undefined &&
      window.developerContacts !== undefined &&
      window.developerAddress !== undefined &&
      window.developerEmail !== undefined &&
      window.developerPhone !== undefined) {
      this.location.path('/');
    }
  }
}

ReadmeController.$inject = ['$window', '$location'];
