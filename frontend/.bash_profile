source ~/.profile

# Setting PATH for Python 3.7
# The original version is saved in .bash_profile.pysave
PATH="/Library/Frameworks/Python.framework/Versions/3.7/bin:${PATH}"
export PATH
# added by Anaconda3 2019.07 installer
# >>> conda init >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$(CONDA_REPORT_ERRORS=false '/Users/Surya2001/anaconda3/bin/conda' shell.bash hook 2> /dev/null)"
if [ $? -eq 0 ]; then
    \eval "$__conda_setup"
else
    if [ -f "/Users/Surya2001/anaconda3/etc/profile.d/conda.sh" ]; then
        . "/Users/Surya2001/anaconda3/etc/profile.d/conda.sh"
        CONDA_CHANGEPS1=false conda activate base
    else
        \export PATH="/Users/Surya2001/anaconda3/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda init <<<
source $HOME/cs61b-software/adm/login
export REPO_DIR=/Users/Surya2001/cs61bfall2020/fa20-s1250
export SNAPS_DIR=/Users/Surya2001/snaps-fa20-s1250

# Setting PATH for Python 3.13
# The original version is saved in .bash_profile.pysave
PATH="/Library/Frameworks/Python.framework/Versions/3.13/bin:${PATH}"
export PATH
export PATH="$PATH:/usr/local/bin"




