var chai = require('chai');
var sinon = require('sinon');
var nock = require('nock');
var URLSafeBase64 = require('urlsafe-base64');

var User = require('../src/user');
var Robot = require('../src/robot');
var TextMessage = require('../src/message').TextMessage;
var Response = require('../src/response');

chai.use(require('sinon-chai'));
expect = chai.expect;

describe('Response', function() {
  var robot, adapter;

  beforeEach(function() {
    this.user = new User('UDEADBEEF1',
    {
      name: 'nestorbottester',
      room: 'CDEADBEEF1'
    });
    this.robot = new Robot('TDEADBEEF', 'UNESTORBOT1', false);
    this.message = new TextMessage(this.user, 'message123');
    this.response = new Response(this.robot, this.message);
  });

  describe('Public API', function() {
    describe('send', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        it('should buffer responses in robot.toSend', function() {
          this.response.send('hello');
          expect(this.robot.toSend).to.eql([{strings:['hello'], reply: false}]);
        });
      });

      context('when not in debug mode', function() {
        var params, scope;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
        });

        context('with only a single string as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer('hello')),
                reply: false
              }
            }

            scope = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.send('hello', function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });

        context('with multiple strings as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer("hello 1\nhello 2")),
                reply: false
              }
            }

            scope = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.send(['hello 1', 'hello 2'], function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });
      });
    });

    describe('reply', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        it('should buffer responses in robot.toSend', function() {
          this.response.reply('hello');
          expect(this.robot.toSend).to.eql([{strings:['hello'], reply: true}]);
        });
      });

      context('when not in debug mode', function() {
        var params, scope;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
        });

        context('with only one string as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer('hello')),
                reply: true
              }
            }

            scope = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.reply('hello', function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });

        context('with multiple strings as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer("hello 1\nhello 2")),
                reply: true
              }
            }

            scope = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.reply(['hello 1', 'hello 2'], function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });

        context('with multiple calls to msg.reply (with promises)', function() {
          var scope1, scope2, params1, params2;

          beforeEach(function() {
            params1 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer('hello 1')),
                reply: true
              }
            }

            params2 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer("hello 2")),
                reply: true
              }
            }

            scope1 = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params1)
                .reply(202);

            scope2 = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params2)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function(done) {
            var _this = this;

            _this.response.reply('hello 1').
            then(function() {
              _this.response.reply('hello 2');
            }).
            then(function() {
              expect(scope1.isDone()).to.be.true;
              expect(scope2.isDone()).to.be.true;
              done();
            });
          });
        });

        context('with multiple calls to msg.reply (with callback)', function() {
          var scope1, scope2, params1, params2;

          beforeEach(function() {
            params1 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer("hello 1")),
                reply: true
              }
            }

            params2 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                strings: URLSafeBase64.encode(new Buffer("hello 2")),
                reply: true
              }
            }

            scope1 = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params1)
                .reply(202);

            scope2 = nock('https://v2.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params2)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function(done) {
            var _this = this;

            _this.response.reply('hello 1', function() {
              _this.response.reply('hello 2', function() {
                expect(scope1.isDone()).to.be.true;
                expect(scope2.isDone()).to.be.true;
                done();
              });
            });
          });
        });
      });
    });
  });
});
