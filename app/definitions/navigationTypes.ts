import { NavigatorScreenParams } from '@react-navigation/core';
import { StackNavigationOptions } from '@react-navigation/stack';

import { IRoom } from './IRoom';
import { IServer } from './IServer';
import { IAttachment } from './IAttachment';
import { MasterDetailInsideStackParamList } from '../stacks/MasterDetailStack/types';
import { OutsideParamList, InsideStackParamList } from '../stacks/types';

export type TNavigationOptions = {
	navigationOptions?(param: object): StackNavigationOptions;
};

export type SetUsernameStackParamList = {
	SetUsernameView: {
		title: string;
	};
};

export type StackParamList = {
	AuthLoading: undefined;
	OutsideStack: NavigatorScreenParams<OutsideParamList>;
	InsideStack: NavigatorScreenParams<InsideStackParamList>;
	MasterDetailStack: NavigatorScreenParams<MasterDetailInsideStackParamList>;
	SetUsernameStack: NavigatorScreenParams<SetUsernameStackParamList>;
};

export type ShareInsideStackParamList = {
	ShareListView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		isShareExtension: boolean;
		serverInfo: IServer;
		text: string;
		room: IRoom;
		thread: any; // TODO: Change
	};
	SelectServerView: undefined;
};

export type ShareOutsideStackParamList = {
	WithoutServersView: undefined;
};

export type ShareAppStackParamList = {
	AuthLoading?: undefined;
	OutsideStack?: NavigatorScreenParams<ShareOutsideStackParamList>;
	InsideStack?: NavigatorScreenParams<ShareInsideStackParamList>;
};
