import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

export default new ApolloClient({
  link: new HttpLink({
    uri: 'http://67.207.68.241:8080/v1alpha1/graphql',
    headers: {
      'X-Hasura-Admin-Secret': 'myadminsecretkey'
    }
  }),
  cache: new InMemoryCache()
})
