import { CacheMap } from './src/Cache.js';
import AppBase from './src/structures/AppBase.js';
import AchievementPercentage from './src/structures/AchievementPercentage.js';
import { Country, State, City } from './src/structures/Locations.js';
import NewsPost from './src/structures/NewsPost.js';
import Server, { ServerRegion } from './src/structures/Server.js';
import Game from './src/structures/Game.js';
import GameDetails from './src/structures/GameDetails.js';
import GameInfo from './src/structures/GameInfo.js';
import GameInfoExtended from './src/structures/GameInfoExtended.js';
import GameInfoBasic from './src/structures/GameInfoBasic.js';
import GameServer from './src/structures/GameServer.js';
import UserAchievement from './src/structures/UserAchievement.js';
import UserAchievements from './src/structures/UserAchievements.js';
import UserBadge from './src/structures/UserBadge.js';
import UserBadges from './src/structures/UserBadges.js';
import UserPlaytime from './src/structures/UserPlaytime.js';
import UserBans from './src/structures/UserBans.js';
import UserFriend from './src/structures/UserFriend.js';
import UserServer from './src/structures/UserServer.js';
import UserServers from './src/structures/UserServers.js';
import UserStat from './src/structures/UserStat.js';
import UserStats from './src/structures/UserStats.js';
import UserSummary, { UserPersonaState } from './src/structures/UserSummary.js';
import SteamAPI, {
	SteamAPIOptions,
	GetGameNewsOptions,
	GetUserOwnedGamesOptions,
	Currency,
	Language,
} from './src/SteamAPI.js';
import {
	EnvConfig,
	parseEnvContent,
	getSteamApiKey,
	loadEnvFromContent
} from './src/env-utils.js';
import SteamID from './src/steamid/index.js';

export default SteamAPI;

export {
	// Options interfaces
	type GetGameNewsOptions,
	type GetUserOwnedGamesOptions,
	type SteamAPIOptions,

	// Steam constants
	type Currency,
	type Language,
	ServerRegion,
	UserPersonaState,

	// Environment configuration (WASM compatible only)
	type EnvConfig,
	parseEnvContent,
	getSteamApiKey,
	loadEnvFromContent,

	// Caching interface
	type CacheMap,

	// Structures
	type AppBase,
	type AchievementPercentage,
	NewsPost,
	Server,
	type Country,
	type State,
	type City,
	Game,
	GameDetails,
	GameInfo,
	GameInfoExtended,
	GameInfoBasic,
	GameServer,
	UserAchievement,
	UserAchievements,
	UserBadge,
	UserBadges,
	UserPlaytime,
	UserBans,
	UserFriend,
	UserServer,
	UserServers,
	type UserStat,
	UserStats,
	UserSummary,

	// SteamID utilities
	SteamID,
};
