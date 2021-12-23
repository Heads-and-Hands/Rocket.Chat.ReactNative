import { InteractionManager } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { compareServerVersion, methods } from '../utils';
import reduxStore from '../createStore';
import { setActiveUsers } from '../../actions/activeUsers';
import { setUser } from '../../actions/login';
import database from '../database';

export function subscribeUsersPresence() {
	const serverVersion = reduxStore.getState().server.version;

	// if server is lower than 1.1.0
	if (compareServerVersion(serverVersion, '1.1.0', methods.lowerThan)) {
		if (this.activeUsersSubTimeout) {
			clearTimeout(this.activeUsersSubTimeout);
			this.activeUsersSubTimeout = false;
		}
		this.activeUsersSubTimeout = setTimeout(() => {
			this.sdk.subscribe('activeUsers');
		}, 5000);
	} else if (compareServerVersion(serverVersion, '4.1.0', methods.lowerThan)) {
		this.sdk.subscribe('stream-notify-logged', 'user-status');
	}

	// RC 0.49.1
	this.sdk.subscribe('stream-notify-logged', 'updateAvatar');
	// RC 0.58.0
	this.sdk.subscribe('stream-notify-logged', 'Users:NameChanged');
}

let ids = [];

export default async function getUsersPresence() {
	const serverVersion = reduxStore.getState().server.version;
	const { user: loggedUser } = reduxStore.getState().login;

	// if server is greather than or equal 1.1.0
	if (compareServerVersion(serverVersion, '1.1.0', methods.greaterThanOrEqualTo)) {
		let params = {};

		// if server is greather than or equal 3.0.0
		if (compareServerVersion(serverVersion, '3.0.0', methods.greaterThanOrEqualTo)) {
			// if not have any id
			if (!ids.length) {
				return;
			}
			// Request userPresence on demand
			params = { ids: ids.join(',') };
		}

		try {
			// RC 1.1.0
			const result = await this.sdk.get('users.presence', params);
			console.log({ params });
			this.sdk.subscribe('stream-user-presence', params);
			if (result.success) {
				const { users } = result;

				const activeUsers = ids.reduce((ret, id) => {
					const user = users.find(u => u._id === id) ?? { _id: id, status: 'offline' };
					const { _id, status, statusText } = user;

					if (loggedUser && loggedUser.id === _id) {
						reduxStore.dispatch(setUser({ status, statusText }));
					}

					ret[_id] = { status, statusText };
					return ret;
				}, {});
				InteractionManager.runAfterInteractions(() => {
					reduxStore.dispatch(setActiveUsers(activeUsers));
				});
				ids = [];

				const db = database.active;
				const userCollection = db.get('users');
				users.forEach(async user => {
					try {
						const userRecord = await userCollection.find(user._id);
						await db.action(async () => {
							await userRecord.update(u => {
								Object.assign(u, user);
							});
						});
					} catch (e) {
						// User not found
						await db.action(async () => {
							await userCollection.create(u => {
								u._raw = sanitizedRaw({ id: user._id }, userCollection.schema);
								Object.assign(u, user);
							});
						});
					}
				});
			}
		} catch {
			// do nothing
		}
	}
}

let usersTimer = null;
export function getUserPresence(uid) {
	const auth = reduxStore.getState().login.isAuthenticated;
	const serverVersion = reduxStore.getState().server.version;

	if (compareServerVersion(serverVersion, '4.1.0', methods.lowerThan)) {
		if (!usersTimer) {
			usersTimer = setTimeout(() => {
				if (auth && ids.length) {
					getUsersPresence.call(this);
				}
				usersTimer = null;
			}, 2000);
		}

		if (uid) {
			ids.push(uid);
		}
	}
}
