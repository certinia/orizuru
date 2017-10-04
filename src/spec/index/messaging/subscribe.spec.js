'use strict';

const
	root = require('app-root-path'),
	chai = require('chai'),
	sinonChai = require('sinon-chai'),
	chaiAsPromised = require('chai-as-promised'),
	sinon = require('sinon'),

	Amqp = require(root + '/src/lib/index/messaging/amqp'),

	Subscriber = require(root + '/src/lib/index/messaging/subscribe'),

	mocks = {},

	sandbox = sinon.sandbox.create(),
	expect = chai.expect,
	anyFunction = sinon.match.func;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('index/messaging/subscribe.js', () => {

	beforeEach(() => {
		mocks.Amqp = {
			apply: sandbox.stub(Amqp, 'apply')
		};
		mocks.channel = {
			ack: sandbox.stub(),
			assertQueue: sandbox.stub(),
			consume: sandbox.stub()
		};
		mocks.handler = sandbox.stub();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('subscribe', () => {

		it('should supply messages to the handler', () => {

			// given
			const
				topic = 'TestTopic',
				message = { content: 'TestMessage' };

			mocks.channel.consume.callsFake((topic, callback) => {
				return callback(message);
			});
			mocks.channel.ack.resolves();
			mocks.handler.resolves();
			mocks.Amqp.apply.callsFake(action => {
				return Promise.resolve(action(mocks.channel));
			});

			// when
			return Subscriber.handle({ schemaName: topic, handler: mocks.handler })
				// then
				.then(() => {
					expect(mocks.Amqp.apply).to.have.been.calledOnce;
					expect(mocks.Amqp.apply).to.have.been.calledWith(anyFunction);
					expect(mocks.channel.ack).to.have.been.calledOnce;
					expect(mocks.channel.ack).to.have.been.calledWith(message);
					expect(mocks.channel.assertQueue).to.have.been.calledOnce;
					expect(mocks.channel.assertQueue).to.have.been.calledWith(topic);
					expect(mocks.channel.consume).to.have.been.calledOnce;
					expect(mocks.channel.consume).to.have.been.calledWith(topic, anyFunction);
					expect(mocks.handler).to.have.been.calledOnce;
					expect(mocks.handler).to.have.been.calledWith(message.content);
				});
		});

		it('should handle handler errors', () => {

			// given
			const
				topic = 'TestTopic',
				message = { content: 'TestMessage' };

			mocks.channel.consume.callsFake((topic, callback) => {
				return callback(message);
			});
			mocks.channel.ack.resolves();
			mocks.handler.rejects(new Error('test'));
			mocks.Amqp.apply.callsFake(action => {
				return Promise.resolve(action(mocks.channel));
			});

			// when
			return expect(Subscriber.handle({ schemaName: topic, handler: mocks.handler })).to.be.rejectedWith('test')
				// then
				.then(() => {
					expect(mocks.Amqp.apply).to.have.been.calledOnce;
					expect(mocks.Amqp.apply).to.have.been.calledWith(anyFunction);
					expect(mocks.channel.ack).to.have.been.calledOnce;
					expect(mocks.channel.ack).to.have.been.calledWith(message);
					expect(mocks.channel.assertQueue).to.have.been.calledOnce;
					expect(mocks.channel.assertQueue).to.have.been.calledWith(topic);
					expect(mocks.channel.consume).to.have.been.calledOnce;
					expect(mocks.channel.consume).to.have.been.calledWith(topic, anyFunction);
					expect(mocks.handler).to.have.been.calledOnce;
					expect(mocks.handler).to.have.been.calledWith(message.content);
				});
		});

	});
});
