import {Client} from "tmi.js";

export const testGiftMessage = (client: Client, user: string) => {
	// @ts-ignore
	client.emit(
		"subgift",
		"duke_ferdinand",
		user,
		2,
		"abearygoodbot",
		{plan: "1000", planName: "Tier 1", prime: false},
		{ "display-name": "ABearyGoodBot" }
	);
};

export const testGiftPackMessage = (client: Client) => {
	// @ts-ignore
	client.emit("submysterygift", "duke_ferdinand", "seasidefm", 20, {plan: "2000", planName: "Tier 2", prime: false},);
};

export const testNormalSubMessage = (client: Client) => {
	// @ts-ignore
	client.emit(
		"subscription",
		"duke_ferdinand",
		"abearygoodbot",
		"1000",
		"test",
		{ "display-name": "ABearyGoodBot" }
	);
};