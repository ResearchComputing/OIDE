describe("AceModeService unit tests", function(){
  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.acemodes'));
  beforeEach(module('sandstone.broadcastservice'));

  var aceModeService;

  beforeEach(inject(function(AceModeService){
    aceModeService = AceModeService;
  }));

  var mockBroadcastService;
  module(function($provide) {
      $provide.service('BroadcastService', function() {
          this.sendMessage = function(message) {
              console.log(message);
          }
      });
  });

  beforeEach(inject(function(BroadcastService) {
      mockBroadcastService = BroadcastService;
  }));

  describe('AceModeService', function(){
    it('should return return a mode for the given filepath', function(){
      var mode = aceModeService.getModeForPath("/home/saurabh/main.py");
      expect(mode['mode']).toBe('ace/mode/python');
    });
    it('should return text if the mode is not found', function(){
      var mode = aceModeService.getModeForPath("/home/saurabh/run.aux");
      expect(mode['mode']).toBe('ace/mode/text');
    });
  });

});
