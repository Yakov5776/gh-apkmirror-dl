# gh-apkmirror-dl
This GitHub Action allows you to download APK files from APKMirror.
It supports specifying the organization, repository, app version, and whether to use a bundle.

Credits to [@tanishqmanuja](https://github.com/tanishqmanuja) for the initial apkmirror scraping code.


## Example Usage
```yml
-  uses: Yakov5776/gh-apkmirror-dl@v1.1
       with:
        org: 'fidelity-investments'
        repo: 'fidelity-investments'
        version: '3.96'
        bundle: false
        file_name: 'fidelity.apk'
```

**Optional Parameters:**

- **version:** Defaults to the latest version.
- **bundle:** Defaults to `true` if not provided.
- **file_name:** Defaults to the file name provided by the server if not specified.