# gh-apkmirror-dl
This GitHub Action allows you to download APK files from APKMirror.
It supports specifying the organization, repository, app version, whether to use a bundle, and the file name.

Credits to [@tanishqmanuja](https://github.com/tanishqmanuja) for the initial apkmirror scraping code.


## Example Usage
```yml
-  uses: Yakov5776/gh-apkmirror-dl@v1.2
       with:
        org: 'fidelity-investments'
        repo: 'fidelity-investments'
        version: '3.96'
        bundle: false
        filename: 'fidelity.apk'
```

**Parameters:**

- **org:** The organization name on **APKMirror**.
- **repo:** The repository name on **APKMirror**.
- **version:** (Optional) The version of the app you want to download, defaults to the latest version if not specified.
- **bundle:** (Optional) Whether to use the app bundle instead of the APK file, defaults to `true` if not specified.
- **filename:** (Optional) Defaults to the file name provided by the server if not specified.

**Outputs:**

- **filename:** The filename the app was downloaded as, which will return the file name provided by the server if not overridden by the parameter.