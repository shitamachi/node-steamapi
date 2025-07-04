import { describe, it, expect } from 'vitest';
import SteamID from '../src/steamid/index.js';

function checkProperty(obj: any, prop: string, expected: any) {
	expect(obj[prop]).toBe(expected);
}

function checkProperties(obj: any, expected: any) {
	for (let i in expected) {
		checkProperty(obj, i, expected[i]);
	}
}

describe('SteamID Tests', () => {
	let sid: any, val: any;

	it('parameterless construction', () => {
		sid = new SteamID();
		checkProperties(sid, {
			universe: SteamID.Universe.INVALID,
			type: SteamID.Type.INVALID,
			instance: SteamID.Instance.ALL,
			accountid: 0
		});
	});

	it('fromIndividualAccountID construction', () => {
		sid = SteamID.fromIndividualAccountID(46143802);
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143802
		});
		expect(sid.isValid()).toBe(true);
		expect(sid.isValidIndividual()).toBe(true);
	});

	it('fromIndividualAccountID string construction', () => {
		sid = SteamID.fromIndividualAccountID('46143802');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143802
		});
	});

	it('fromIndividualAccountID BigInt construction', () => {
		sid = SteamID.fromIndividualAccountID(46143802n);
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143802
		});
	});

	it('fromIndividualAccountID invalid', () => {
		sid = SteamID.fromIndividualAccountID('');
		expect(sid.isValid()).toBe(false);
	});

	it('steam2id construction (universe 0)', () => {
		sid = new SteamID('STEAM_0:0:23071901');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143802
		});
	});

	it('steam2id construction (universe 1)', () => {
		sid = new SteamID('STEAM_1:1:23071901');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143803
		});
	});

	it('steam3id construction (individual)', () => {
		sid = new SteamID('[U:1:46143802]');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143802
		});
	});

	it('steam3id construction (gameserver)', () => {
		sid = new SteamID('[G:1:31]');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.GAMESERVER,
			instance: SteamID.Instance.ALL,
			accountid: 31
		});
		expect(sid.isValid()).toBe(true);
		expect(sid.isValidIndividual()).toBe(false);
	});

	it('steam3id construction (anon gameserver)', () => {
		sid = new SteamID('[A:1:46124:11245]');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.ANON_GAMESERVER,
			instance: 11245,
			accountid: 46124
		});
	});

	it('steam3id construction (lobby)', () => {
		sid = new SteamID('[L:1:12345]');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.CHAT,
			instance: SteamID.ChatInstanceFlags.Lobby,
			accountid: 12345
		});
	});

	it('steam3id construction (lobby with instanceid)', () => {
		sid = new SteamID('[L:1:12345:55]');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.CHAT,
			instance: SteamID.ChatInstanceFlags.Lobby | 55,
			accountid: 12345
		});
	});

	it('steamid64 construction (individual)', () => {
		sid = new SteamID('76561198006409530');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143802
		});
	});

	it('steamid64 construction (clan)', () => {
		sid = new SteamID('103582791434202956');
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.CLAN,
			instance: SteamID.Instance.ALL,
			accountid: 4681548
		});
	});

	it('steamid64 BigInt construction (individual)', () => {
		sid = new SteamID(76561198006409530n);
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.INDIVIDUAL,
			instance: SteamID.Instance.DESKTOP,
			accountid: 46143802
		});
	});

	it('steamid64 BigInt construction (clan)', () => {
		sid = new SteamID(103582791434202956n);
		checkProperties(sid, {
			universe: SteamID.Universe.PUBLIC,
			type: SteamID.Type.CLAN,
			instance: SteamID.Instance.ALL,
			accountid: 4681548
		});
	});

	it('invalid construction', () => {
		expect(() => {
			new SteamID('invalid input');
		}).toThrow(Error);
	});

	it('steam2id rendering (universe 0)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.INDIVIDUAL;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 46143802;
		val = sid.getSteam2RenderedID();
		expect(val).toBe('STEAM_0:0:23071901');
	});

	it('steam2id rendering (universe 1)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.INDIVIDUAL;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 46143802;
		val = sid.getSteam2RenderedID(true);
		expect(val).toBe('STEAM_1:0:23071901');
	});

	it('steam2id rendering (shorthand)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.INDIVIDUAL;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 46143802;
		val = sid.steam2();
		expect(val).toBe('STEAM_0:0:23071901');
	});

	it('steam2id rendering (non-individual)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.CLAN;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 4681548;
		expect(() => sid.getSteam2RenderedID()).toThrow(Error);
	});

	it('steam3id rendering (individual)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.INDIVIDUAL;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 46143802;
		val = sid.getSteam3RenderedID();
		expect(val).toBe('[U:1:46143802]');
	});

	it('steam3id rendering (shorthand)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.INDIVIDUAL;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 46143802;
		val = sid.steam3();
		expect(val).toBe('[U:1:46143802]');
	});

	it('steam3id rendering (anon gameserver)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.ANON_GAMESERVER;
		sid.instance = 41511;
		sid.accountid = 43253156;
		val = sid.getSteam3RenderedID();
		expect(val).toBe('[A:1:43253156:41511]');
	});

	it('steam3id rendering (lobby)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.CHAT;
		sid.instance = SteamID.ChatInstanceFlags.Lobby;
		sid.accountid = 451932;
		val = sid.getSteam3RenderedID();
		expect(val).toBe('[L:1:451932]');
	});

	it('steamid64 rendering (individual)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.INDIVIDUAL;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 46143802;
		val = sid.getSteamID64();
		expect(val).toBe('76561198006409530');
	});

	it('steamid64 rendering (anon gameserver)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.ANON_GAMESERVER;
		sid.instance = 188991;
		sid.accountid = 42135013;
		val = sid.getSteamID64();
		expect(val).toBe('90883702753783269');
	});

	it('steamid64 BigInt rendering (individual)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.INDIVIDUAL;
		sid.instance = SteamID.Instance.DESKTOP;
		sid.accountid = 46143802;
		val = sid.getBigIntID();
		expect(val).toBe(76561198006409530n);
	});

	it('steamid64 BigInt rendering (anon gameserver)', () => {
		sid = new SteamID();
		sid.universe = SteamID.Universe.PUBLIC;
		sid.type = SteamID.Type.ANON_GAMESERVER;
		sid.instance = 188991;
		sid.accountid = 42135013;
		val = sid.getBigIntID();
		expect(val).toBe(90883702753783269n);
	});

	it('invalid new id', () => {
		sid = new SteamID();
		expect(sid.isValid()).toBe(false);
	});

	it('invalid individual instance', () => {
		sid = new SteamID('[U:1:46143802:10]');
		expect(sid.isValid()).toBe(false);
		expect(sid.isValidIndividual()).toBe(false);
	});

	it('invalid non-all clan instance', () => {
		sid = new SteamID('[g:1:4681548:2]');
		expect(sid.isValid()).toBe(false);
	});

	it('invalid gameserver id with accountid 0', () => {
		sid = new SteamID('[G:1:0]');
		expect(sid.isValid()).toBe(false);
	});
});