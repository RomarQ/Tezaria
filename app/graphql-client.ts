import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

export default new ApolloClient({
    link: new HttpLink({
        uri: "http://68.183.44.169/v1alpha1/graphql",
        headers: {
            "X-Hasura-Admin-Secret": 'myadminsecretkey'
        }
    }),
    cache: new InMemoryCache()
});
