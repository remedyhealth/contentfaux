# How to contribute

Third-party patches are essential for keeping contentfaux in a
steady state of advancement. We want to keep it as easy as possible to
contribute changes that get things working in your environment. There are
a few guidelines that we need contributors to follow so that we can have a
chance of keeping on top of things.

## Getting Started

* Make sure you have a [GitHub account](https://github.com/signup/free)
* Submit an [issue][newissue] on Github, assuming one does not already exist.
  * Clearly describe the issue including steps to reproduce when it is a bug.
  * Make sure you fill in the earliest version that you know has the issue.
* Fork the repository on GitHub

## Making Changes

* Create a feature branch from where you want to base your work.
  * This is usually the master branch.
  * Only feature release branches if you are certain your fix must be on that
    branch.
  * To quickly create a feature branch based on master; `git checkout -b
    feature/myContribution master`. Please avoid working directly on the
    `master` branch.
* Make commits of logical units.
* Check for unnecessary whitespace with `git diff --check` before committing.
* Make sure your commit messages are in the proper format.

```
    feat: Make the example in CONTRIBUTING imperative and concrete
    Some description here that explains in detail the purpose of the commit message.
    closes #1234
```

* Make sure you have added the necessary tests for your changes.
  * We have tests that check for coverage and code styles. Passing these tests
    is a requirement of having your pull request accepted.
* Run _all_ the tests to assure nothing else was accidentally broken.

## Making Trivial Changes

### Documentation

For changes of a trivial nature to comments and documentation, it is not
always necessary to create a new issue in Github. In this case, it is
appropriate to start the first line of a commit with '(doc)' instead of
an issue number.

```
    chore(doc): Add documentation commit example to CONTRIBUTING
    This is a simple example of a documenation change that doesn't effect
    the software as a whole.
```

## Submitting Changes

* Push your changes to a feature branch in your fork of the repository.
* Submit a pull request to the [repository][repo] in the [remedyhealth organization][org].
* Update your Github issue to mark that you have submitted code and are
  ready for it to be reviewed (Label: ready for merge).
  * Include a link to the pull request in the issue.
* The core team will look at your pull request. Any and all comments
  or discussions will happen on the request itself.
* Any pull requests that are waiting for a response and have not been
  updated in two weeks are subject to be closed.

[org]: https://github.com/remedyhealth
[repo]: https://github.com/remedyhealth/contentfaux
[newissue]: https://github.com/remedyhealth/contentfaux/issues/new
