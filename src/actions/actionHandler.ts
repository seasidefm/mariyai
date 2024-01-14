import { getBotInstance } from '../bot'
import { getLogger } from '../logger'
import { ServerWebSocket } from 'bun'

const logger = getLogger('server')
const bot = getBotInstance()

export enum Action {
    FirstLoad = 'FIRST_LOAD',
    Reset = 'RESET',
    Ping = 'PING',
    Pong = 'PONG',
    Jazz = 'JAZZ',

    // Duck state
    GetState = 'GET_STATE',
    FinalDuckCount = 'FINAL_DUCK_COUNT',
    Spawn = 'SPAWN',
    Jump = 'JUMP',
    SpaceJump = 'SPACEJUMP',
    SetDuckSize = 'SET_DUCK_SIZE',
    Run = 'RUN',
    Spin = 'SPIN',
    Quack = 'QUACK',
    GetIt = 'GET_IT',
}

export type Payload =
    | {
          action: Action.FirstLoad
          data: {
              clientName: string
          }
      }
    | {
          action: Action.Reset
      }
    | {
          action: Action.Ping
          data: {
              timestamp: number
          }
      }
    | {
          action: Action.Pong
          data: {
              timestamp: number
          }
      }
    | {
          action: Action.GetState
      }
    | {
          action: Action.Spawn
          data: {
              username: string
              isModerator: boolean
              color: string
              scale: number // default 1
              wideness: number // default 0
              eligiblePromotions?: Record<string, number>[]
          }
      }
    | {
          action: Action.Jazz
          data: {
              username: string
              shouldJazz: boolean
          }
      }
    | {
          action: Action.Jump
          data: {
              username: string
          }
      }
    | {
          action: Action.Spin
          data: {
              username: string
          }
      }
    | {
          action: Action.SpaceJump
          data: {
              username: string
          }
      }
    | {
          action: Action.SetDuckSize
          data: {
              username: string
              scale: number
              wideness: number
              eligiblePromotions?: Record<string, Record<string, number>>[]
          }
      }
    | {
          action: Action.Run
          data: {
              username: string
          }
      }
    | {
          action: Action.Quack
          data: {
              username: string
          }
      }
    | {
          action: Action.GetIt
          data: {
              username: string
          }
      }

export async function actionHandler(
    msg: string,
    _ws: ServerWebSocket<unknown>,
) {
    try {
        const data: Payload = JSON.parse(msg.toString())

        switch (data.action) {
            case Action.FirstLoad: {
                logger.info(`client connected: ${data.action}`)
                bot.addSocket(data.data.clientName, _ws as ServerWebSocket)

                break
            }

            case Action.GetState: {
                _ws.send(JSON.stringify({ state: 'woohoo' }))
                break
            }

            default: {
                const error = `Cannot find action in payload: ` + msg
                logger.error(error)

                _ws.send(error)
            }
        }
    } catch (e) {
        logger.error(`Cannot parse JSON from msg: ${msg}`)
        _ws.send(
            JSON.stringify({
                error: 'Cannot parse JSON, please check payload',
            }),
        )
    }
}
