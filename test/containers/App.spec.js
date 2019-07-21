import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { createBrowserHistory } from 'history';
import { ConnectedRouter } from 'connected-react-router';
import App from '../../app/containers/App';
import { configureStore } from '../../app/store/configureStore';

Enzyme.configure({ adapter: new Adapter() });

function setup(initialState) {
	const store = configureStore(initialState);
	const history = createBrowserHistory();
	const provider = (
		<Provider store={store}>
			<ConnectedRouter history={history}>
				<App />
			</ConnectedRouter>
		</Provider>
	);

	const app = mount(provider);
	return {
		app,
		connectionStatus: app.find('#connectionStatus')
	};
}

describe('containers', () => {
	describe('App', () => {
		it('Connection status should switch from green to red when connection is lost.', () => {
			const { app } = setup();

			// Check if connection status is green (Online)
			expect(app.find('#connectionStatus').getDOMNode().className).toMatch('green');

			// Simulate offline connection
			jest.spyOn(navigator, 'onLine', 'get').mockImplementation(() => false);
			act(() => {
				// Fire offline event
				window.dispatchEvent(new Event('offline'));
			});
			// Check if connection status switched to red (Offline)
			expect(app.find('#connectionStatus').getDOMNode().className).toMatch('red');
		});
	});
});
