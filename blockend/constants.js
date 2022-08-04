const TODO = 'todo'
const IN_PROGRESS = 'in-progress'
const TO_VERIFY = 'to-verify'
const DONE = 'done'
const WONTFIX = 'wontfix'

const ALLOWED_STATES = [TODO, IN_PROGRESS, TO_VERIFY, DONE, WONTFIX]
const OWNERSHIP_CHANGE = [TO_VERIFY, DONE, WONTFIX]
const DECAY = [DONE, WONTFIX]

module.exports = {
  TODO,
  IN_PROGRESS,
  TO_VERIFY,
  DONE,
  WONTFIX,
  ALLOWED_STATES,
  OWNERSHIP_CHANGE,
  DECAY
}
