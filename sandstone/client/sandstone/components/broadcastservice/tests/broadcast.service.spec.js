describe('BroadcastService', function() {
  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.websocketservice'));
  beforeEach(module('sandstone.broadcastservice'));

  var BroadcastService, WebsocketService, $location, mockConnection;

  beforeEach(inject(function(_WebsocketService_,_BroadcastService_,_$location_) {
    WebsocketService = _WebsocketService_;
    $location = _$location_;
    mockConnection = jasmine.createSpyObj('mockConnection',['send']);
    spyOn(WebsocketService,'connect').and.returnValue(mockConnection);
    BroadcastService = _BroadcastService_;
  }));

  it('initialize', function() {
    var url = 'wss://testhost.com:8888/messages';
    spyOn($location, 'protocol').and.returnValue('https');
    spyOn($location, 'port').and.returnValue('8888');
    spyOn($location, 'host').and.returnValue('testhost.com');
    BroadcastService.initialize();
    expect(WebsocketService.connect.calls.count()).toEqual(1);
    expect(WebsocketService.connect.calls.argsFor(0)[0]).toEqual(url);
  });

  it('getBroadcastUrl', function() {
    var url, bUrl;
    url = 'wss://testhost.com:8888/messages';
    spyOn($location, 'protocol').and.returnValue('https');
    spyOn($location, 'port').and.returnValue('8888');
    spyOn($location, 'host').and.returnValue('testhost.com');
    bUrl = BroadcastService.getBroadcastUrl();
    expect(bUrl).toEqual(url);

    url = 'ws://localhost:80/messages';
    $location.protocol.and.returnValue('http');
    $location.port.and.returnValue('80');
    $location.host.and.returnValue('localhost');
    bUrl = BroadcastService.getBroadcastUrl();
    expect(bUrl).toEqual(url);
  });

  it('sendMessage', function() {
    var msg = {
      key: 'test:test_msg',
      data: {
        test: 'test_data'
      }
    };
    var sMsg = JSON.stringify(msg);
    BroadcastService.initialize();
    mockConnection.send.calls.reset();
    BroadcastService.sendMessage(msg);
    expect(mockConnection.send.calls.count()).toEqual(1);
    expect(mockConnection.send.calls.argsFor(0)[0]).toEqual(sMsg);
  });
});
