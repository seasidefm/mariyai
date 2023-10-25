import {Client} from "tmi.js";
import {getLogger} from "../logger.ts";

const logger = getLogger("gift-sub")

enum SubWeight {
  Prime = "Prime",
  Normal = "1000",
  Tier2 = "2000",
  Tier3 = "3000"
}

function mapValueToSubWeight(value: string): SubWeight {
	switch (value) {
		case "Prime":
			return SubWeight.Prime
		case "1000":
			return SubWeight.Normal
		case "2000":
			return SubWeight.Tier2
		case "3000":
			return SubWeight.Tier3
		default:
			throw new Error(`Unknown sub weight: ${value}`)
	}
}

const SubWeightMap = {
  [SubWeight.Prime]: 1,
  [SubWeight.Normal]: 1,
  [SubWeight.Tier2]: 2,
  [SubWeight.Tier3]: 3
}

type OnEvent = (username: string, normalizedGiftWeight: number) => Promise<void> | void

export const onGiftSubEvent = (client: Client, onEvent: OnEvent) => {
	logger.info(
		"Registering 'submysterygift' event handler (multiple gift subs)"
	);

	async function handleGiftEvent(username: string, count = 1, weight = 1) {
		// Surface event to listeners
		onEvent(username, count * weight)
	}

	client.on(
		"submysterygift",
		async (channel, username, subCount, subType, userState) => {
      // logger.info(
      //   `#${channel}: ${username} gifted ${subCount} to ${userState["display-name"]}`
      // );
      // logger.info(`> Sub tier: ${SubWeightMap[subType.plan as SubWeight]}`)

			logger.warn("This is not currently handled! Probably doesn't need to be?")

			// await handleGiftEvent(
			// 	username,
			// 	1,
			// 	SubWeightMap[mapValueToSubWeight(subType.plan || SubWeight.Normal)]
			// )
		}
	);

	logger.info("Registering 'subgift' event handler (single gift sub)");

	client.on(
		"subgift",
		async (
			channel,
			username,
			_streakMonths,
			recipient,
			subType,
			_userState
		) => {
			logger.info(
				`#${channel}: ${username} just gifted a sub to ${recipient}`
			);
      logger.info(`> Sub tier: ${SubWeightMap[subType.plan as SubWeight]}`)

			// TODO: Debounce this
			await handleGiftEvent(
				username,
				1,
				SubWeightMap[mapValueToSubWeight(subType.plan || SubWeight.Normal)]
			)
		}
	);
};