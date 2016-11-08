import java.util.ArrayList;
import java.util.List;

import java.io.FileInputStream;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;

public class Authenticate {

    public static void main(String[] args) throws Exception {

        FileInputStream inputStream = new FileInputStream("../token.txt");
        String token;
        try {
            token = IOUtils.toString(inputStream);
        } finally {
            inputStream.close();
        }

        System.out.println("token.txt = ");
        System.out.println(token);
        CloseableHttpClient httpclient = HttpClients.createDefault();
        try {
            HttpPost httpPostAuthen = new HttpPost("http://localhost:3002/security/authen");
            List <NameValuePair> nvpsAuthen = new ArrayList <NameValuePair>();
            nvpsAuthen.add(new BasicNameValuePair("clientId", "ExampleCompany"));
            nvpsAuthen.add(new BasicNameValuePair("org", "ExampleCompany"));
            nvpsAuthen.add(new BasicNameValuePair("email", "demo@example.com"));
            nvpsAuthen.add(new BasicNameValuePair("password", "demo"));
            httpPostAuthen.setEntity(new UrlEncodedFormEntity(nvpsAuthen));
            CloseableHttpResponse responseAuthen = httpclient.execute(httpPostAuthen);
            try {
                System.out.println(EntityUtils.toString(responseAuthen.getEntity()));
            } finally {
                responseAuthen.close();
            }

            HttpPost httpPostUserApi = new HttpPost("http://localhost:3002/api/user/load");
            // httpPostUserApi.setHeader("x-access-token", token);
            List <NameValuePair> nvpsUserApi = new ArrayList <NameValuePair>();
            nvpsUserApi.add(new BasicNameValuePair("clientId", "ExampleCompany"));
            nvpsUserApi.add(new BasicNameValuePair("email", "demo@example.com"));
            nvpsUserApi.add(new BasicNameValuePair("token", token));
            httpPostUserApi.setEntity(new UrlEncodedFormEntity(nvpsUserApi));
            CloseableHttpResponse responseUserApi = httpclient.execute(httpPostUserApi);
            try {
                System.out.println(EntityUtils.toString(responseUserApi.getEntity()));
            } finally {
                responseUserApi.close();
            }
        } finally {
            httpclient.close();
        }
    }

}