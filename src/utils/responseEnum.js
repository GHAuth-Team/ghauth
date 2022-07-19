const YggdrasilResponse = (ctx) => {
  return {
    success(data) {
      ctx.status = 200
      ctx.body = data
    },
    forbidden(errorMessage) {
      ctx.status = 403
      ctx.body = {
        error: 'ForbiddenOperationException',
        errorMessage
      }
    },
    noContent() {
      ctx.status = 204
    },
    invalidToken() {
      ctx.status = 403
      ctx.body = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid token.'
      }
    },
    invalidCredentials() {
      ctx.status = 403
      ctx.body = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid credentials. Invalid username or password.'
      }
    },
    tokenAssigned() {
      ctx.status = 400
      ctx.body = {
        error: 'IllegalArgumentException',
        errorMessage: 'Access token already has a profile assigned.'
      }
    }
  }
}

const GHAuthResponse = (ctx) => {
  return {
    success(data) {
      ctx.status = 200
      ctx.body = data
    },
    forbidden(errorMessage) {
      ctx.status = 403
      ctx.body = {
        error: 'ForbiddenOperationException',
        errorMessage
      }
    }
  }
}

module.exports = { YggdrasilResponse, GHAuthResponse }
