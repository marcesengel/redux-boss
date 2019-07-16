# Example

`fetchUsers.js`
```javascript
import axios from 'axios'
import Action from 'redux-boss'
import { toast } from 'react-toastify'

export default new Action(
  'FETCH_USERS', (branch) => async (emit, getState) => {
    emit('start', branch)

    const { data: users } = await axios.get(
      'https://myserver.com/users',
      { params: { branch } }
    )

    emit('finish', { branch, users })
  }
)
  .on('start', function (branch) {
    this.toastId = toast(`Fetching users for branch '${branch}'.`, { autoClose: false })
  })
  .on('finish', function ({ branch }) {
    toast.update(this.toastId, {
      render: `Fetched users for branch '${branch}'.`,
      type: toast.TYPE.INFO,
      autoClose: 3000
    })
  })
  .on('finish', 'Users', function (Users, { branch, users }) {
    return Users.set(branch, users)
  })
  .seal()
```

`myComponent.js`
```javascript
import React from 'react'
import { connect } from 'react-redux'
import fetchUsers from './fetchUsers'

const Component = ({ fetchUsers }) => (
  <React.Fragment>
    <button onClick={() => fetchUsers('engineering')}>
      Engineering
    </button>

    <button onClick={() => fetchUsers('management')}>
      Management
    </button>
  </React.Fragment>
)

export default connect(null, { fetchUsers })(Component)
```

`store.js`
```javascript
import { createStore } from 'redux'

import { createReducer } from 'redux-boss'
import createDefaultStore from './defaultStore'
import middleware from './middleware'

export default createStore(createReducer(createDefaultStore), middleware)
```
